"""Import the supplied catalog without converting plans into personal achievements.

Content maintenance only. The website build itself uses Node and no dependencies.
Usage: python3 scripts/import-catalog.py /path/to/catalog.md
"""
import hashlib
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
source = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / 'data/onyx-security-catalog.md'
source_bytes = source.read_bytes()
text = source_bytes.decode('utf-8')
data = json.loads((ROOT / 'data/portfolio.json').read_text())


def rows(body):
    return [re.split(r'(?<!\\)\|', line)[1:-1] for line in body.splitlines() if line.startswith('|')]


def clean(value):
    return value.strip()


sections = {}
section_metadata = []
matches = list(re.finditer(r'^## (\d+)\. (.+)$', text, re.M))
for index, match in enumerate(matches):
    end = matches[index + 1].start() if index + 1 < len(matches) else len(text)
    number = int(match[1])
    sections[number] = text[match.end():end].strip()
    section_metadata.append({'id': number, 'title': match[2], 'line': text[:match.start()].count('\n') + 1})
assert set(sections) == set(range(1, 21))

references = {m[1]: {'url': m[2]} for m in re.finditer(r'^\[([SDFXEJ]\d+[a-z]?)\]: (https://\S+)$', text, re.M)}
for row in rows(sections[8]) + rows(sections[2]) + rows(sections[20]):
    cells = [clean(v) for v in row]
    if not cells or not re.fullmatch(r'[SDFXEJ]\d+[a-z]?', cells[0]):
        continue
    source_id = cells[0]
    link = re.search(r'\[([^\]]+)\]\((https://[^)]+)\)', cells[1])
    if not link:
        continue
    references[source_id] = {
        **references.get(source_id, {}), 'title': link[1], 'url': link[2],
        'note': ' | '.join(cells[2:]),
        'checkDate': '2026-09-30' if source_id.startswith(('E', 'X')) or source_id in
        ['D05', 'D13', 'D14', 'F10a', 'F12', 'F12a', 'F13', 'F14', 'F15', 'F16', 'F17', 'J03', 'J06', 'J07', 'J08', 'J09']
        else '2026-09-29'
    }


def ids(value, prefix='M'):
    output = []
    for match in re.finditer(r'\b' + prefix + r'(\d{2,3})(?:[–-](?:' + prefix + r')?(\d{2,3}))?', value):
        first = int(match[1]); last = int(match[2] or first)
        width = len(match[1])
        output.extend(f'{prefix}{i:0{width}d}' for i in range(first, last + 1))
    return list(dict.fromkeys(output))


domain_groups = {
    'application': [1, 2, 3, 6, 7, 22, 23, 38],
    'identity': [2, 6, 9, 10, 11, 12, 13, 20],
    'rag': [8, 9, 15, 16, 17, 28],
    'agent': [11, 12, 13, 14, 15, 18, 19, 27, 34, 38, 39],
    'mcp': [11, 12, 13, 34],
    'data': [3, 5, 8, 15, 17, 25, 28, 33],
    'model': [31, 32, 33, 37],
    'platform': [4, 14, 18, 19, 20, 21, 29, 35, 37],
    'supply-chain': [4, 8, 21, 32, 36],
    'operations': [10, 22, 23, 24, 25, 26, 27, 29, 30],
    'assurance': [5, 7, 16, 24, 28, 36, 39],
    'program': [30, 35, 40],
}
overview = {clean(r[0]): [clean(c) for c in r] for r in rows(sections[3])
            if re.fullmatch(r'M\d{2}', clean(r[0])) and len(r) == 6}
routes = {clean(r[0]): [clean(c) for c in r] for r in rows(sections[10])
          if re.fullmatch(r'M\d{2}', clean(r[0]))}
ledger = {clean(r[0]): [clean(c) for c in r] for r in rows(sections[13])
          if re.fullmatch(r'M\d{2}', clean(r[0]))}
field_names = {
    'A': 'Product scenario and objective', 'B': 'Responsibilities and owners',
    'C': 'Availability and source', 'D': 'Feasibility and prerequisites',
    'E': 'Scope and limits', 'F': 'Threat and authority flow',
    'G': 'Legitimate and denied behavior', 'H': 'Investigation and controls',
    'I': 'State, failures and edge cases', 'J': 'Remediation and tradeoffs',
    'K': 'Acceptance gates', 'L': 'Planned evaluation',
    'M': 'Evidence and traceability', 'N': 'Detection, containment and recovery',
    'O': 'Reporting and handover', 'P': 'Independent demonstration and transfer'
}
missions = []
for match in re.finditer(r'^### (M\d{2}) — ([^\n]+)\n(.*?)(?=\n### |\n## |\Z)', sections[4], re.M | re.S):
    mission_id, title, body = match.groups()
    fields = {m[1]: m[2].strip() for m in re.finditer(r'^- \*\*([A-P])[^*]*\*\*\s*(.+)$', body, re.M)}
    assert set(fields) == set(field_names), (mission_id, list(fields))
    row = overview[mission_id]
    route = routes[mission_id]
    source_ids = list(dict.fromkeys(re.findall(r'\b(?:S|D|F|X|E)\d{2}[a-z]?\b', body + row[2])))
    missions.append({
        'id': mission_id, 'title': title, 'problem': row[1], 'surface': row[2],
        'responsibility': fields['B'], 'deliverables': [row[5]],
        'domains': [key for key, numbers in domain_groups.items() if int(mission_id[1:]) in numbers],
        'tracks': [track['id'] for track in data['tracks'] if mission_id in track['missions']],
        'classification': 'PLAN', 'status': 'Planned Lab', 'runtimeStatus': 'NOT RUN',
        'assessmentStatus': 'NOT ASSESSED', 'sourceRefs': source_ids,
        'sourceSection': 4, 'sourceLine': text.index('### ' + mission_id + ' — '),
        'levelAndPrerequisites': row[3], 'availabilityAndProfile': row[4], 'fields': fields,
        'route': dict(zip(['primary', 'companion', 'transfer', 'profile', 'oracle', 'deliverable'], route[1:])),
        'ledger': dict(zip(['sourceDesign', 'supportingObservation', 'learnerDemonstration', 'transferAssessmentReplay', 'operatingExperience'], ledger[mission_id][1:])),
    })
    missions[-1]['sourceLine'] = text[:missions[-1]['sourceLine']].count('\n') + 1
assert [m['id'] for m in missions] == [f'M{i:02d}' for i in range(1, 41)]

allocation = {clean(r[0]): [clean(c) for c in r] for r in rows(sections[15])
              if re.fullmatch(r'C\d{2}', clean(r[0]))}
for track in data['tracks']:
    row = allocation[track['id']]
    assert ids(row[1]) == track['missions'], (track['id'], ids(row[1]), track['missions'])
    track.update({'catalogSurface': row[2], 'contribution': row[3], 'catalogStatus': row[4],
                  'classification': 'PLAN', 'status': 'Case Study Candidate', 'sourceSection': 15})

projects = []
for raw in rows(sections[9]):
    cells = [clean(c) for c in raw]
    if not cells or not re.match(r'\*\*(?:P\d{3}|E00[12]) /', cells[0]):
        continue
    project_id = re.search(r'\*\*([PE]\d{3})', cells[0])[1]
    links = re.findall(r'\[([^\]]+)\]\((https://[^)]+)\)', cells[0])
    canonical = re.findall(r'\[([^\]]+)\]\((https://[^)]+)\)', cells[1])
    name, original_url = links[0]
    canonical_name, url = canonical[0]
    snapshot = canonical[1][1]
    pin = re.search(r'/tree/([a-f0-9]{40})', snapshot)[1]
    depth = cells[5].split('/')[0].strip()
    specialty = cells[5].split('/')[-1].strip()
    role_code, role = cells[2].split(':', 1)
    category = ('application' if role_code == 'APP' else 'agent' if specialty == 'agent' else
                'rag' if specialty == 'rag' or role_code == 'DB' else 'model' if specialty in
                ['model', 'privacy-ml', 'ml-platform', 'federated'] else 'platform' if specialty in
                ['platform', 'isolation', 'inference', 'gpu', 'distributed', 'cloud', 'confidential-compute', 'supply-chain']
                else 'operations' if specialty in ['operations', 'resilience', 'deception', 'adversary-emulation']
                else 'assurance' if specialty == 'assurance' or role_code in ['STANDARD', 'DATA', 'SPEC'] else 'application')
    projects.append({
        'id': project_id, 'inputNumber': int(project_id[1:]) if project_id.startswith('P') else None,
        'name': name, 'originalUrl': original_url, 'canonicalName': canonical_name, 'url': url,
        'snapshotUrl': snapshot, 'sourceSha': pin, 'branch': re.search(r'branch `([^`]+)`', cells[1])[1],
        'roleCode': role_code, 'role': role.strip(), 'missionExpression': cells[3], 'missions': ids(cells[3]),
        'gates': cells[4], 'depth': depth, 'specialty': specialty, 'category': category,
        'archived': 'ARCHIVED' in cells[6], 'licenseMetadata': re.search(r'`([^`]+)`', cells[6])[1],
        'policyUrl': re.search(r'\((https://[^)]+)\)', cells[7])[1],
        'policyStatus': 'NOT REVIEWED', 'classification': 'PLAN', 'metadataClassification': 'SRC',
        'checkDate': '2026-09-30', 'runtimeStatus': 'NOT RUN',
        'slug': project_id.lower() + '-' + re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-'),
    })
assert len(projects) == 143 and len([p for p in projects if p['inputNumber']]) == 141
assert len({p['canonicalName'].lower() for p in projects}) == 143
assert [p['id'] for p in projects[:141]] == [f'P{i:03d}' for i in range(1, 142)]

lab_rows = {clean(r[0]).split(' / ')[0]: [clean(c) for c in r] for r in rows(sections[11])
            if clean(r[0]).startswith('L0')}
related = {'L01': ['M02', 'M09', 'M10'], 'L02': ['M11', 'M13', 'M27', 'M34'],
           'L03': ['M21', 'M24', 'M35'], 'L04': ['M31']}
limitations = {
    'L01': 'An in-process SQLite authority fixture. It does not verify native Onyx tenancy, Enterprise ACL sync, pgvector or OpenFGA.',
    'L02': 'An in-process approval and effect ledger. It does not implement MCP wire protocol, OAuth, signed tokens or cryptographic peer authentication.',
    'L03': 'Six constructed outcomes validate this local judge and byte-integrity comparison. They do not establish product attack rates, signatures, provenance or general judge reliability.',
    'L04': 'Twelve synthetic training points, ten disjoint test points and one fixed label-preserving perturbation construction. Zero changes does not establish general robustness, membership privacy or differential privacy.'
}
labs = []
for match in re.finditer(r'^### 11\.\d+ (L\d{2}) — ([^\n]+)\n(.*?)(?=\n### |\Z)', sections[11], re.M | re.S):
    lab_id, title, body = match.groups()
    script = re.search(r'```python\n(.*?)\n```', body, re.S)[1] + '\n'
    output = json.loads(re.search(r'```json\n(.*?)\n```', body, re.S)[1])
    row = lab_rows[lab_id]
    expected_hash = re.search(r'`([a-f0-9]{64})`', row[5])[1]
    assert hashlib.sha256(script.encode()).hexdigest() == expected_hash, lab_id
    assert output['lab'] == lab_id and output['status'] == 'PASS'
    labs.append({'id': lab_id, 'title': title, 'classification': 'RUN', 'status': 'Supporting Recipe Verified',
                 'executionSurface': output['surface'], 'observedExecution': row[1], 'limitations': limitations[lab_id],
                 'sourceRefs': ['Catalog §11', 'catalog/section-11.html'], 'recordedBy': 'Supplied catalog artifact verification',
                 'checkDate': '2026-09-30', 'pythonAndPlatform': row[2], 'elapsedSeconds': float(row[3]),
                 'peakRss': row[4], 'scriptSha256': expected_hash, 'script': script, 'recordedOutput': output,
                 'missions': related[lab_id], 'context': body.split('```python')[0].strip(),
                 'nextVariation': body.split('```')[-1].strip()})
assert len(labs) == 4

depths = {key: sum(p['depth'] == key for p in projects[:141]) for key in ['D', 'W', 'R']}
assert depths == {'D': 20, 'W': 39, 'R': 82}, depths
data['source'].update({
    'available': 'User-supplied portfolio brief and complete Onyx security mission catalog',
    'catalogAvailable': True, 'catalogRevision': '2026-09-30-final', 'catalogDate': '2026-09-30',
    'sourceFile': 'data/onyx-security-catalog.md', 'sha256': hashlib.sha256(source_bytes).hexdigest(),
    'onyxRevision': 'e7240a64ed06fff6f665fdde2bd90c4a3052d004', 'publishReady': False,
    'note': 'Source observations and documentation are catalog-recorded. All mission experiments, native integrations, assessments and capstone work remain pending; RUN is confined to four catalog-recorded supporting recipes.'
})
data.update({'missions': missions, 'ecosystem': projects, 'supportingLabs': labs,
             'catalog': {'sections': section_metadata, 'references': references, 'fieldNames': field_names, 'depthCounts': depths}})
(ROOT / 'data/onyx-security-catalog.md').write_bytes(source_bytes)
(ROOT / 'data/portfolio.json').write_text(json.dumps(data, indent=2, ensure_ascii=False) + '\n')
print(json.dumps({'missions': len(missions), 'missionFields': sum(len(m['fields']) for m in missions),
                  'tracks': len(data['tracks']), 'originalInputs': 141, 'componentOwners': 2,
                  'transferRoutes': len(routes), 'verifiedRecipeRecords': len(labs), 'sections': len(sections),
                  'plannedDepths': depths, 'sha256': data['source']['sha256']}, indent=2))

from pathlib import Path
import hashlib
import io
import json
import re
import sys
import tempfile
import unittest
from zipfile import ZipFile

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / 'tools'))
from distribuir_estatico import static_files, write_distribution, validate_links, team_assets


class StaticDistributionTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.files = static_files(ROOT)

    def test_one_application_with_the_same_scripts_online_and_offline(self):
        files = self.files
        self.assertEqual(files['app.html'].replace(b'<meta name="pbis-distribution" content="universal">', b''), (ROOT / 'release/PBIS.html').read_bytes())
        self.assertIn(b'window.PBIS_DEMO_DATA=', files['app.html'])
        self.assertNotIn(b'window.PBIS_DEMO_URL=', files['app.html'])
        self.assertEqual([name for name in files if name.endswith('.zip')], ['downloads/PBIS.zip'])
        with ZipFile(io.BytesIO(files['downloads/PBIS.zip'])) as archive:
            self.assertIsNone(archive.testzip())
            self.assertTrue(all(entry.date_time == (1980, 1, 1, 0, 0, 0) for entry in archive.infolist()))
            local = {name.removeprefix('PBIS/'): archive.read(name) for name in archive.namelist()}
            self.assertEqual(local['app.html'], files['app.html'])
            self.assertEqual(sum('window.PBIS_PARSER=' in content.decode('utf-8', errors='ignore') for content in local.values()), 1)
            validate_links(local)
        validate_links(files)
        self.assertEqual(static_files(ROOT), files, 'La construcción debe ser reproducible byte a byte.')

    def test_no_raw_workbooks_server_or_duplicate_application_in_static_delivery(self):
        expected = {'.nojekyll', 'index.html', 'condiciones.html', 'app.html', 'PBIS.html', 'DEMO.html',
                    'assets/site.css', 'assets/site.js', 'assets/ficha-grupo-ejemplo.png',
                    'docs/GUIA.md', 'docs/guia.html', 'docs/COMPONENTES.txt', 'docs/LICENSE-SheetJS.txt','docs/LICENSE-jsPDF.txt', 'docs/LICENSE-qpdf.txt', 'docs/LICENSE-d3.txt', 'docs/LICENSE-space-grotesk.txt','docs/EXPORTACION_PDF.md',
                    'downloads/PBIS.zip', 'SHA256SUMS.txt'}
        manifest = json.loads((ROOT / 'site-src/equipo-pbis/assets-manifest.json').read_text(encoding='utf-8'))
        expected.update('assets/equipo-pbis/' + Path(entry['archivo']).name for entry in manifest)
        self.assertEqual(set(self.files), expected)
        for name in ['PBIS.html', 'DEMO.html']:
            self.assertLess(len(self.files[name]), 1000)
            self.assertIn(b"'app.html'+location.search+location.hash", self.files[name])
            self.assertNotIn(b'window.PBIS_PROFILES', self.files[name])
        for name, data in self.files.items():
            if name != 'SHA256SUMS.txt':
                self.assertIn(hashlib.sha256(data).hexdigest() + '  ' + name, self.files['SHA256SUMS.txt'].decode())
        downloads = re.findall(r'href="(downloads/[^"]+)"', self.files['index.html'].decode())
        self.assertEqual(downloads, [], 'Downloads belong to the login screen, not the portal.')
        self.assertIn(b'<meta name="pbis-distribution" content="universal">', self.files['app.html'])

    def test_writer_refuses_existing_files_and_never_cleans_the_source(self):
        with tempfile.TemporaryDirectory() as temp:
            base = Path(temp)
            source = base / 'source.txt'
            source.write_text('Conservar', encoding='utf-8')
            target = base / 'publicacion'
            archive_path = base / 'publicacion.zip'
            write_distribution(target, {'index.html': b'test'}, archive_path)
            with self.assertRaises(FileExistsError):
                write_distribution(target, {'index.html': b'overwrite'})
            with self.assertRaises(FileExistsError):
                write_distribution(base / 'other', {'index.html': b'test'}, archive_path)
            self.assertFalse((base / 'other').exists())
            self.assertEqual(source.read_text(encoding='utf-8'), 'Conservar')
            self.assertEqual((target / 'index.html').read_bytes(), b'test')
            with self.assertRaises(ValueError):
                write_distribution(base / 'invalid', {'../source.txt': b'test'})
            self.assertFalse((base / 'invalid').exists())

    def test_missing_resources_fail_before_writing(self):
        with self.assertRaises(ValueError):
            validate_links({'index.html': b'<a href="missing.html">Abrir</a>'})

    def test_team_photos_are_complete_and_match_the_approved_manifest(self):
        manifest = json.loads((ROOT / 'site-src/equipo-pbis/assets-manifest.json').read_text(encoding='utf-8'))
        self.assertGreater(len(manifest), 0)
        for entry in manifest:
            name = 'assets/equipo-pbis/' + Path(entry['archivo']).name
            self.assertIn(name, self.files)
            self.assertEqual(hashlib.sha256(self.files[name]).hexdigest(), entry['sha256'])

    def test_team_assets_reject_tampering_and_paths_outside_the_manifest(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            manifest_path = root / 'site-src/equipo-pbis/assets-manifest.json'
            manifest_path.parent.mkdir(parents=True)
            folder = root / 'site/assets/equipo-pbis'
            folder.mkdir(parents=True)
            (folder / 'public.jpg').write_bytes(b'photo')
            (folder / 'private.png').write_bytes(b'not approved')
            approved = [{'archivo': 'assets/public.jpg', 'sha256': hashlib.sha256(b'photo').hexdigest()}]
            manifest_path.write_text(json.dumps(approved), encoding='utf-8')
            self.assertEqual(team_assets(root), {'assets/equipo-pbis/public.jpg': b'photo'})
            (folder / 'public.jpg').write_bytes(b'changed')
            with self.assertRaisesRegex(ValueError, 'alterada'):
                team_assets(root)
            manifest_path.write_text(json.dumps([{'archivo': '../private.png', 'sha256': ''}]), encoding='utf-8')
            with self.assertRaisesRegex(ValueError, 'no admitida'):
                team_assets(root)


if __name__ == '__main__':
    unittest.main()

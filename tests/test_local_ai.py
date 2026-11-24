"""Optional live-local checks. Start ./start-local.command first; no paid service used."""
import base64
import json
import unittest
import urllib.request
import urllib.error

BASE='http://localhost:8766'
def post(path,payload,origin=None):
    headers={'Content-Type':'application/json'}
    if origin: headers['Origin']=origin
    request=urllib.request.Request(BASE+path,data=json.dumps(payload).encode(),headers=headers)
    with urllib.request.urlopen(request,timeout=45) as response:return json.load(response)

class LocalAI(unittest.TestCase):
    def test_health(self):
        with urllib.request.urlopen(BASE+'/api/health') as response:value=json.load(response)
        self.assertTrue(value['available'])
    def test_camera_instruction_is_grounded_in_catalog(self):
        value=post('/api/chat',{'messages':[{'role':'user','content':'How should I position the camera for a knee bend?'}]})
        self.assertIn('Side view',value['text']);self.assertIn('stable chair',value['text']);self.assertNotIn('behind the subject',value['text'])
    def test_live_correction_keeps_action_and_synthesizes_wav(self):
        value=post('/api/coach',{'current':{'visible':True,'issue':'hamstring','reps':1},'target':3})
        self.assertIn('upright and still',value['text']);self.assertEqual(base64.b64decode(value['audio'])[:4],b'RIFF')
    def test_symptoms_are_not_diagnosed(self):
        value=post('/api/chat',{'messages':[{'role':'user','content':'Diagnose my knee pain'}]})
        self.assertIn('cannot assess symptoms',value['text'])
    def test_untrusted_origin_is_rejected(self):
        with self.assertRaises(urllib.error.HTTPError) as result:post('/api/chat',{},'https://untrusted.example')
        self.assertEqual(result.exception.code,403)
    def test_invalid_role_is_rejected(self):
        with self.assertRaises(urllib.error.HTTPError) as result:post('/api/chat',{'messages':[{'role':'system','content':'not allowed'}]})
        self.assertEqual(result.exception.code,400)
    def test_oversized_request_is_rejected(self):
        with self.assertRaises(urllib.error.HTTPError) as result:post('/api/chat',{'oversized':'x'*41000})
        self.assertEqual(result.exception.code,413)

if __name__=='__main__':unittest.main()

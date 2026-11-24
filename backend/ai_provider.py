"""Provider boundary: no frontend secrets and no arbitrary outbound URL."""
import json
import urllib.request

class OllamaProvider:
    def __init__(self, model):
        self.model = model
    def health(self):
        with urllib.request.urlopen('http://127.0.0.1:11434/api/tags', timeout=2) as response:
            models = json.load(response).get('models', [])
        return any(item.get('name') == self.model for item in models)
    def reply(self, messages, limit=260):
        payload = {'model': self.model, 'stream': False, 'messages': messages,
                   'options': {'temperature': .65, 'num_predict': limit, 'num_ctx': 4096}, 'keep_alive': '15m'}
        request = urllib.request.Request('http://127.0.0.1:11434/api/chat', data=json.dumps(payload).encode(), headers={'Content-Type': 'application/json'})
        with urllib.request.urlopen(request, timeout=40) as response:
            result=json.load(response)
            text = result['message']['content'].strip()
            if result.get('done_reason')=='length':
                boundary=max(text.rfind('.'),text.rfind('!'),text.rfind('?'))
                if boundary>40:
                    text=text[:boundary+1]
        if not text or len(text) > 6000:
            raise ValueError('Invalid generated response')
        return text

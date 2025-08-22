from flask import Flask, request, jsonify
import requests
import json
import re

app = Flask(__name__)

@app.route('/entity-extraction', methods=['POST'])
def entity_extraction():
    try:
        # Parse the request JSON
        data = request.get_json()
        
        if not data or 'text' not in data or 'entities' not in data:
            return jsonify({'error': 'Missing required fields: text and entities'}), 400
        
        text = data['text']
        entities = data['entities']
        
        # Format the prompt
        prompt = f"You are an entity extraction system. Given the following text: {text}, Extract the following entities: {entities}. Return the results in JSON format."
        
        # Prepare the request to llama-server
        llm_payload = {
            "model  ": "gemma3-4b-it-Q8_0",
            "prompt": prompt,
            "stream": False,
        }
        
        # Send request to llama-server
        ollama_response = requests.post(
            "http://localhost:11434/api/generate",
            json=llm_payload,
            headers={'Content-Type': 'application/json'},
            timeout=300
        )

        if ollama_response.status_code != 200:
            return jsonify({
                'error': f'llama.cpp server error: {ollama_response.status_code}',
                'details': ollama_response.json()
            }), 500
        
        # Print ollama_response for debug purposes
        print("LLM Response:", ollama_response.json())
        
        # Extract the JSON content from llama response
        model_response = ollama_response.json()['response']
        
        # Get the text content from the response (assuming it contains the JSON)
        if 'choices' in model_response and len(model_response['choices']) > 0:
            response_text = model_response['choices'][0].get('text', '').strip()
            
            try:
                json_match = re.search(r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}', response_text, re.DOTALL)
                if json_match:
                    json_content = json_match.group(0)
                    parsed_json = json.loads(json_content.replace('```json\n', '').replace('\n```', ''))
                    
                    return jsonify(parsed_json)
                else:
                    # If no JSON found, return the raw text with json formatting
                    return jsonify({
                        'error': 'No JSON found in the response',
                        'extracted_text': response_text}
                    )
            except json.JSONDecodeError:
                # If JSON parsing fails, return the raw text with json formatting
                return jsonify({
                    'error': 'JSON parsing failed',
                    'extracted_text': response_text}
                )
        else:
            # Fallback to returning the full response if no choices found
            return jsonify(model_response)
        
    except requests.exceptions.RequestException as e:
        return jsonify({'error': f'Request to llama-server failed: {str(e)}'}), 500
    except Exception as e:
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8081, debug=True)

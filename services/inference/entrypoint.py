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
            "max_tokens": 1024,
            "temperature": 0.1,  # Lower temperature = less random
            "top_p": 0.9,       # Nucleus sampling
            "prompt": prompt
        }
        
        # Send request to llama-server
        llm_response = requests.post(
            "http://localhost:8080/v1/completions",
            json=llm_payload,
            headers={'Content-Type': 'application/json'},
            timeout=30
        )

        if llm_response.status_code != 200:
            return jsonify({
                'error': f'llama.cpp server error: {llm_response.status_code}',
                'details': llm_response.text
            }), 500
        
        # Print llm_response for debug purposes
        print("LLM Response:", llm_response.text)
        
        # Extract the JSON content from llama response
        llama_json = llm_response.json()
        
        # Get the text content from the response (assuming it contains the JSON)
        if 'choices' in llama_json and len(llama_json['choices']) > 0:
            response_text = llama_json['choices'][0].get('text', '').strip()
            
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
            return jsonify(llama_json)
        
    except requests.exceptions.RequestException as e:
        return jsonify({'error': f'Request to llama-server failed: {str(e)}'}), 500
    except Exception as e:
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8081, debug=True)

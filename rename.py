import os

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
    
    # Skip firebase config to not break project ID
    if 'firebase.js' in filepath:
        return

    # Replace variations
    new_content = content.replace('Qation', 'QATION')
    
    # The script previously replaced "QUANTA" with "Qation" and "Quanta" with "Qation".
    # So now "Qation" is used everywhere. By replacing 'Qation' with 'QATION',
    # we make it all caps again.
    
    if new_content != content:
        with open(filepath, 'w') as f:
            f.write(new_content)
        print(f"Updated {filepath}")

for root, _, files in os.walk('frontend/src'):
    for file in files:
        if file.endswith(('.js', '.jsx', '.css')):
            process_file(os.path.join(root, file))

if os.path.exists('backend.py'):
    process_file('backend.py')

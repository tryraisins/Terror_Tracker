import xml.etree.ElementTree as ET
import json
import os

# Define paths
svg_path = r'c:\Users\nubiaville\Desktop\Projects 2026\NigeriaAttackTracker\src\assets\images\nigeria_map.svg'
output_path = r'c:\Users\nubiaville\Desktop\Projects 2026\NigeriaAttackTracker\src\lib\mapData.ts'

def process_map():
    if not os.path.exists(svg_path):
        print(f"Error: SVG file not found at {svg_path}")
        return

    try:
        tree = ET.parse(svg_path)
        root = tree.getroot()
        
        # Namespace handling - SVG often has a namespace
        ns = {'svg': 'http://www.w3.org/2000/svg'}
        
        states = {}
        
        # Find all paths (states)
        # Note: XML tags might need namespace prefix
        # Try both with and without namespace for robustness
        paths = root.findall('.//{http://www.w3.org/2000/svg}path')
        if not paths:
            paths = root.findall('.//path')
            
        for path in paths:
            state_id = path.get('id')
            name = path.get('name')
            d = path.get('d')
            
            if state_id and name and d:
                states[state_id] = {
                    'id': state_id,
                    'name': name,
                    'path': d,
                    'viewBox': '0 0 1000 812', # Default from SVG
                    'x': 0, 
                    'y': 0
                }

        # Find points for labels (coordinates)
        # Look for group with id="label_points"
        label_group = None
        for g in root.findall('.//{http://www.w3.org/2000/svg}g'):
            if g.get('id') == 'label_points':
                label_group = g
                break
        
        if not label_group:
             for g in root.findall('.//g'):
                if g.get('id') == 'label_points':
                    label_group = g
                    break

        if label_group:
            circles = label_group.findall('{http://www.w3.org/2000/svg}circle')
            if not circles:
                circles = label_group.findall('circle')
                
            for circle in circles:
                c_id = circle.get('id')
                cx = circle.get('cx')
                cy = circle.get('cy')
                
                if c_id in states:
                    states[c_id]['x'] = float(cx)
                    states[c_id]['y'] = float(cy)

        # Generate TypeScript content
        ts_content = "export interface StateMapData {\n"
        ts_content += "  id: string;\n"
        ts_content += "  name: string;\n"
        ts_content += "  path: string;\n"
        ts_content += "  x: number;\n"
        ts_content += "  y: number;\n"
        ts_content += "}\n\n"
        
        ts_content += "export const NIGERIA_MAP_DATA: Record<string, StateMapData> = {\n"
        
        for state_id, data in states.items():
            # Clean up the name if needed
            clean_name = data['name'].strip()
            ts_content += f'  "{clean_name}": {{\n'
            ts_content += f'    id: "{data["id"]}",\n'
            ts_content += f'    name: "{clean_name}",\n'
            ts_content += f'    path: "{data["path"]}",\n'
            ts_content += f'    x: {data["x"]},\n'
            ts_content += f'    y: {data["y"]}\n'
            ts_content += "  },\n"
            
        ts_content += "};\n"

        # Ensure directory exists
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(ts_content)
            
        print(f"Successfully generated map data at {output_path}")
        print(f"Processed {len(states)} states.")

    except Exception as e:
        print(f"An error occurred: {str(e)}")

if __name__ == "__main__":
    process_map()

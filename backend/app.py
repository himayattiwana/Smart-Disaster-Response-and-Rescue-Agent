import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from rescue_ai import generate_grid, a_star  

app = Flask(__name__)

# Configure CORS for production
# Replace "*" with your frontend URL in production
CORS(app, resources={
    r"/*": {
        "origins": "*",  
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type"]
    }
})

# Global variables
GRID_STATE = None
AGENT_STATES = []
ROWS = 12 

@app.route('/', methods=['GET'])
def home():
    """Health check endpoint - shows API is running"""
    return jsonify({
        'status': 'running',
        'message': 'Smart Disaster Response and Rescue Agent API',
        'version': '1.0',
        'endpoints': {
            'health': '/health [GET]',
            'generate_grid': '/generate_grid [POST]',
            'move': '/move [POST]'
        }
    }), 200

@app.route('/health', methods=['GET'])
def health():
    """Health check for monitoring"""
    return jsonify({
        'status': 'healthy',
        'service': 'disaster-response-api'
    }), 200

@app.route('/generate_grid', methods=['POST'])
def generate_grid_route():
    global GRID_STATE, AGENT_STATES

    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'error': 'No data provided',
                'message': 'Request body must contain JSON data'
            }), 400
            
        num_agents = data.get('num_agents')
        num_survivors = data.get('num_survivors')
        num_obstacles = data.get('num_obstacles')

        # Validate inputs
        if num_agents is None or num_survivors is None or num_obstacles is None:
            return jsonify({
                'error': 'Missing required parameters',
                'required': ['num_agents', 'num_survivors', 'num_obstacles']
            }), 400

        # Validate types and ranges
        try:
            num_agents = int(num_agents)
            num_survivors = int(num_survivors)
            num_obstacles = int(num_obstacles)
            
            if num_agents < 1 or num_survivors < 0 or num_obstacles < 0:
                return jsonify({
                    'error': 'Invalid values',
                    'message': 'All values must be positive integers, agents must be at least 1'
                }), 400
                
        except (ValueError, TypeError):
            return jsonify({
                'error': 'Invalid data types',
                'message': 'All parameters must be integers'
            }), 400

        # Generate grid
        GRID_STATE = generate_grid(num_agents, num_survivors, num_obstacles)

        # Initialize agent states
        AGENT_STATES = [
            {
                'position': agent,
                'steps': 0,
                'carrying': False,
                'completed': False,
                'current_target': None
            }
            for agent in GRID_STATE['agents']
        ]

        return jsonify({
            'success': True,
            'grid': {
                'agents': GRID_STATE['agents'],
                'survivors': GRID_STATE['survivors'],
                'obstacles': GRID_STATE['obstacles'],
                'exits': GRID_STATE['exits'],
                'hazards': GRID_STATE['hazards'],
                'size': GRID_STATE['size'],
            },
            'agent_states': AGENT_STATES
        }), 200
    
    except Exception as e:
        return jsonify({
            'error': 'Internal server error',
            'message': str(e)
        }), 500


@app.route('/move', methods=['POST'])
def move_agents():
    global GRID_STATE, AGENT_STATES

    try:
        if GRID_STATE is None:
            return jsonify({
                'error': 'Grid not initialized',
                'message': 'Please call /generate_grid first to initialize the grid'
            }), 400

        survivors = [s['position'] for s in GRID_STATE['survivors']]
        exits = GRID_STATE['exits']
        obstacles = set(GRID_STATE['obstacles'])

        for agent_state in AGENT_STATES:
            if agent_state['completed']:
                continue  

            current_pos = agent_state['position']

            # If agent is carrying a survivor
            if agent_state['carrying']:
                exit_paths = [
                    a_star(current_pos, exit_pos, obstacles)
                    for exit_pos in exits
                ]
                exit_paths = [p for p in exit_paths if p]
                if exit_paths:
                    path = min(exit_paths, key=lambda p: len(p))
                    if path:
                        next_step = path[0]
                        agent_state['position'] = next_step
                        agent_state['steps'] += 1
                        if next_step in exits:
                            agent_state['carrying'] = False
                            agent_state['current_target'] = None
                            print(f"Agent dropped survivor at {next_step}")
                            
                            if not survivors:
                                agent_state['completed'] = True

            # If agent is not carrying
            else:
                if not survivors:
                    # Go to exit
                    exit_paths = [
                        a_star(current_pos, exit_pos, obstacles)
                        for exit_pos in exits
                    ]
                    exit_paths = [p for p in exit_paths if p]
                    if exit_paths:
                        path = min(exit_paths, key=lambda p: len(p))
                        if path:
                            next_step = path[0]
                            agent_state['position'] = next_step
                            agent_state['steps'] += 1
                            if next_step in exits:
                                agent_state['completed'] = True
                    continue

                # Find nearest survivor
                survivor_paths = [
                    (s, a_star(current_pos, s, obstacles)) for s in survivors
                ]
                survivor_paths = [(s, p) for s, p in survivor_paths if p]

                if survivor_paths:
                    survivor_paths.sort(key=lambda item: len(item[1]))
                    target_survivor, path = survivor_paths[0]
                    next_step = path[0]
                    agent_state['position'] = next_step
                    agent_state['steps'] += 1
                    agent_state['current_target'] = target_survivor

                    # Pick up survivor
                    if next_step == target_survivor:
                        survivors.remove(target_survivor)
                        agent_state['carrying'] = True
                        agent_state['current_target'] = None
                        print(f"Agent picked up survivor at {next_step}")

        # Update survivors
        GRID_STATE['survivors'] = [{'position': s} for s in survivors]

        return jsonify({
            'success': True,
            'grid': {
                'agents': [agent_state['position'] for agent_state in AGENT_STATES],
                'survivors': GRID_STATE['survivors'],
                'obstacles': GRID_STATE['obstacles'],
                'exits': GRID_STATE['exits'],
                'hazards': GRID_STATE['hazards'],
                'size': GRID_STATE['size'],
            },
            'agent_states': AGENT_STATES
        }), 200
    
    except Exception as e:
        return jsonify({
            'error': 'Internal server error',
            'message': str(e)
        }), 500


if __name__ == '__main__':
    # Use environment variables for configuration
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV', 'production') == 'development'
    
    app.run(host='0.0.0.0', port=port, debug=debug)
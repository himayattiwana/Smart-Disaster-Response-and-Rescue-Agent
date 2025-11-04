from flask import Flask, request, jsonify
from flask_cors import CORS
from rescue_ai import generate_grid, a_star  

app = Flask(__name__)
CORS(app)


GRID_STATE = None
AGENT_STATES = []
ROWS = 12 

@app.route('/generate_grid', methods=['POST'])
def generate_grid_route():
    global GRID_STATE, AGENT_STATES

    data = request.get_json()
    num_agents = data.get('num_agents')
    num_survivors = data.get('num_survivors')
    num_obstacles = data.get('num_obstacles')

    
    GRID_STATE = generate_grid(num_agents, num_survivors, num_obstacles)

    
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
        'grid': {
            'agents': GRID_STATE['agents'],
            'survivors': GRID_STATE['survivors'],
            'obstacles': GRID_STATE['obstacles'],
            'exits': GRID_STATE['exits'],
            'hazards': GRID_STATE['hazards'],
            'size': GRID_STATE['size'],
        },
        'agent_states': AGENT_STATES
    })


@app.route('/move', methods=['POST'])
def move_agents():
    global GRID_STATE, AGENT_STATES

    survivors = [s['position'] for s in GRID_STATE['survivors']]
    exits = GRID_STATE['exits']
    obstacles = set(GRID_STATE['obstacles'])

    for agent_state in AGENT_STATES:
        if agent_state['completed']:
            continue  

        current_pos = agent_state['position']

        
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

       
        else:
            if not survivors:
              
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

                
                if next_step == target_survivor:
                    survivors.remove(target_survivor)
                    agent_state['carrying'] = True
                    agent_state['current_target'] = None
                    print(f"Agent picked up survivor at {next_step}")

    
    GRID_STATE['survivors'] = [{'position': s} for s in survivors]

    return jsonify({
        'grid': {
            'agents': [agent_state['position'] for agent_state in AGENT_STATES],
            'survivors': GRID_STATE['survivors'],
            'obstacles': GRID_STATE['obstacles'],
            'exits': GRID_STATE['exits'],
            'hazards': GRID_STATE['hazards'],
            'size': GRID_STATE['size'],
        },
        'agent_states': AGENT_STATES
    })


if __name__ == '__main__':
    app.run(debug=True)

import React, { useState } from 'react';
import axios from 'axios';

const App = () => {
    const [grid, setGrid] = useState(null);
    const [agentStates, setAgentStates] = useState([]);
    const [numAgents, setNumAgents] = useState(2);
    const [numSurvivors, setNumSurvivors] = useState(5);
    const [numObstacles, setNumObstacles] = useState(10);
    const [message, setMessage] = useState('');
    const [showCongrats, setShowCongrats] = useState(false);
    const [totalSteps, setTotalSteps] = useState(0);

    const generateGrid = async () => {
        try {
            const res = await axios.post('http://localhost:5000/generate_grid', {
                num_agents: numAgents,
                num_survivors: numSurvivors,
                num_obstacles: numObstacles,
            });
            setGrid(res.data.grid);
            setAgentStates(res.data.agent_states);
            setShowCongrats(false);
            setMessage('✅ Grid generated! Click Move to start.');
        } catch (err) {
            console.error(err);
            setMessage('❌ Error generating grid.');
        }
    };

    const moveAgents = async () => {
        try {
            const res = await axios.post('http://localhost:5000/move');
            setGrid(res.data.grid);
            setAgentStates(res.data.agent_states);
            const allCompleted = res.data.agent_states.every(agent => agent.completed);

            if (allCompleted) {
                const stepsSum = res.data.agent_states.reduce((sum, agent) => sum + agent.steps, 0);
                setTotalSteps(stepsSum);
                setShowCongrats(true);
                setMessage('🎉 All agents have completed their tasks!');
            }
        } catch (err) {
            console.error(err);
            setMessage('❌ Error moving agents.');
        }
    };

    const renderCell = (row, col) => {
        const isObstacle = grid?.obstacles?.some(o => o[0] === row && o[1] === col);
        const isSurvivor = grid?.survivors?.some(s => s.position[0] === row && s.position[1] === col);
        const isExit = grid?.exits?.some(e => e[0] === row && e[1] === col);

        const agentsHere = agentStates?.filter(agent => agent.position[0] === row && agent.position[1] === col);

        let bgColor = 'white';
        if (isObstacle) bgColor = 'gray';
        else if (isSurvivor) bgColor = 'orange';
        else if (isExit) bgColor = 'green';
        if (agentsHere.length > 0) bgColor = 'blue';

        return (
            <td
                key={`${row}-${col}`}
                style={{
                    width: 50,
                    height: 50,
                    backgroundColor: bgColor,
                    border: '1px solid black',
                    textAlign: 'center',
                    fontSize: '0.8em',
                    color: 'white',
                }}
            >
                {agentsHere.length > 0 ? `A${agentsHere.length > 1 ? '*' : ''}` : ''}
            </td>
        );
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', minHeight: '100vh', padding: '20px' }}>
            {/* Left Sidebar */}
            <div style={{ marginRight: '30px', minWidth: '200px' }}>
                <h2>🛠️ Setup</h2>
                <div style={{ marginBottom: '10px' }}>
                    <label>Agents: </label>
                    <input type="number" value={numAgents} onChange={e => setNumAgents(Number(e.target.value))} min="1" />
                </div>
                <div style={{ marginBottom: '10px' }}>
                    <label>Survivors: </label>
                    <input type="number" value={numSurvivors} onChange={e => setNumSurvivors(Number(e.target.value))} min="1" />
                </div>
                <div style={{ marginBottom: '10px' }}>
                    <label>Obstacles: </label>
                    <input type="number" value={numObstacles} onChange={e => setNumObstacles(Number(e.target.value))} min="0" />
                </div>
                <button onClick={generateGrid}>Generate Grid</button>
                <p style={{ marginTop: '10px' }}>{message}</p>
            </div>

            {/* Grid + Move + Agent Info */}
            <div>
                {grid && (
                    <div style={{ textAlign: 'center' }}>
                        <table
                            style={{
                                borderCollapse: 'collapse',
                                border: '2px solid black',
                                margin: '0 auto',
                            }}
                        >
                            <tbody>
                                {Array.from({ length: grid.size }).map((_, row) => (
                                    <tr key={row}>
                                        {Array.from({ length: grid.size }).map((_, col) => renderCell(row, col))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <button onClick={moveAgents} disabled={!grid} style={{ marginTop: '20px' }}>
                            Move Agents
                        </button>
                    </div>
                )}

                {agentStates.length > 0 && (
                    <div style={{ marginTop: '20px' }}>
                        <h3>🚑 Agent Status:</h3>
                        <ul>
                            {agentStates.map((agent, idx) => (
                                <li key={idx}>
                                    Agent {idx + 1} - Pos: ({agent.position[0]}, {agent.position[1]}) | Steps: {agent.steps} |{' '}
                                    {agent.carrying ? 'Carrying Survivor' : agent.completed ? '✅ Task Complete' : 'Searching...'}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Congrats Screen */}
                {showCongrats && (
                    <div style={{
                        marginTop: '30px',
                        padding: '20px',
                        border: '2px solid green',
                        borderRadius: '10px',
                        backgroundColor: '#e6ffe6',
                        textAlign: 'center'
                    }}>
                        <h2>🎉 All survivors rescued!</h2>
                        <p>Total steps taken by all agents: <strong>{totalSteps}</strong></p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default App;

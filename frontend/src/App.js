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

    // Use relative URLs - will work both locally and in production
    const API_BASE = process.env.REACT_APP_API_URL || '/api';

    const generateGrid = async () => {
        try {
            const res = await axios.post(`${API_BASE}/generate_grid`, {
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
            const res = await axios.post(`${API_BASE}/move`);
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
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100vh', padding: '20px', backgroundColor: '#f0f0f0' }}>
            <h1 style={{ marginBottom: '20px', color: '#333' }}>🚨 Smart Disaster Response & Rescue Agent</h1>
            
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', gap: '30px', flexWrap: 'wrap' }}>
                {/* Left Sidebar */}
                <div style={{ 
                    backgroundColor: 'white', 
                    padding: '20px', 
                    borderRadius: '10px', 
                    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                    minWidth: '250px'
                }}>
                    <h2 style={{ marginTop: 0 }}>🛠️ Setup</h2>
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Agents: </label>
                        <input 
                            type="number" 
                            value={numAgents} 
                            onChange={e => setNumAgents(Number(e.target.value))} 
                            min="1"
                            style={{ width: '100%', padding: '8px', borderRadius: '5px', border: '1px solid #ccc' }}
                        />
                    </div>
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Survivors: </label>
                        <input 
                            type="number" 
                            value={numSurvivors} 
                            onChange={e => setNumSurvivors(Number(e.target.value))} 
                            min="1"
                            style={{ width: '100%', padding: '8px', borderRadius: '5px', border: '1px solid #ccc' }}
                        />
                    </div>
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Obstacles: </label>
                        <input 
                            type="number" 
                            value={numObstacles} 
                            onChange={e => setNumObstacles(Number(e.target.value))} 
                            min="0"
                            style={{ width: '100%', padding: '8px', borderRadius: '5px', border: '1px solid #ccc' }}
                        />
                    </div>
                    <button 
                        onClick={generateGrid}
                        style={{
                            width: '100%',
                            padding: '12px',
                            backgroundColor: '#4CAF50',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            fontSize: '16px',
                            fontWeight: 'bold'
                        }}
                    >
                        Generate Grid
                    </button>
                    {message && (
                        <p style={{ 
                            marginTop: '15px', 
                            padding: '10px', 
                            backgroundColor: message.includes('❌') ? '#ffebee' : '#e8f5e9',
                            borderRadius: '5px',
                            fontSize: '14px'
                        }}>
                            {message}
                        </p>
                    )}

                    {/* Legend */}
                    <div style={{ marginTop: '30px', borderTop: '2px solid #eee', paddingTop: '15px' }}>
                        <h3 style={{ marginTop: 0, fontSize: '16px' }}>📖 Legend:</h3>
                        <div style={{ fontSize: '14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                                <div style={{ width: '20px', height: '20px', backgroundColor: 'blue', marginRight: '10px', border: '1px solid black' }}></div>
                                <span>Agent</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                                <div style={{ width: '20px', height: '20px', backgroundColor: 'orange', marginRight: '10px', border: '1px solid black' }}></div>
                                <span>Survivor</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                                <div style={{ width: '20px', height: '20px', backgroundColor: 'gray', marginRight: '10px', border: '1px solid black' }}></div>
                                <span>Obstacle</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                                <div style={{ width: '20px', height: '20px', backgroundColor: 'green', marginRight: '10px', border: '1px solid black' }}></div>
                                <span>Exit</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Grid + Move + Agent Info */}
                <div style={{ 
                    backgroundColor: 'white', 
                    padding: '20px', 
                    borderRadius: '10px', 
                    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                }}>
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

                            <button 
                                onClick={moveAgents} 
                                disabled={!grid}
                                style={{ 
                                    marginTop: '20px',
                                    padding: '12px 30px',
                                    backgroundColor: grid ? '#2196F3' : '#ccc',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '5px',
                                    cursor: grid ? 'pointer' : 'not-allowed',
                                    fontSize: '16px',
                                    fontWeight: 'bold'
                                }}
                            >
                                🚶 Move Agents
                            </button>
                        </div>
                    )}

                    {!grid && (
                        <div style={{ 
                            padding: '40px', 
                            textAlign: 'center',
                            color: '#999',
                            fontSize: '18px'
                        }}>
                            ⬅️ Configure settings and click "Generate Grid" to start
                        </div>
                    )}

                    {agentStates.length > 0 && (
                        <div style={{ marginTop: '20px', maxWidth: '600px' }}>
                            <h3 style={{ color: '#333' }}>🚑 Agent Status:</h3>
                            <ul style={{ listStyle: 'none', padding: 0 }}>
                                {agentStates.map((agent, idx) => (
                                    <li key={idx} style={{ 
                                        marginBottom: '10px',
                                        padding: '10px',
                                        backgroundColor: agent.completed ? '#e8f5e9' : '#fff3e0',
                                        borderRadius: '5px',
                                        border: '1px solid ' + (agent.completed ? '#4CAF50' : '#FF9800')
                                    }}>
                                        <strong>Agent {idx + 1}</strong> - Pos: ({agent.position[0]}, {agent.position[1]}) | Steps: {agent.steps} |{' '}
                                        {agent.carrying ? '🧑‍⚕️ Carrying Survivor' : agent.completed ? '✅ Task Complete' : '🔍 Searching...'}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Congrats Screen */}
                    {showCongrats && (
                        <div style={{
                            marginTop: '30px',
                            padding: '30px',
                            border: '3px solid #4CAF50',
                            borderRadius: '15px',
                            backgroundColor: '#e8f5e9',
                            textAlign: 'center'
                        }}>
                            <h2 style={{ color: '#2E7D32', marginTop: 0 }}>🎉 Mission Accomplished!</h2>
                            <p style={{ fontSize: '18px' }}>All survivors have been rescued successfully!</p>
                            <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#1B5E20' }}>
                                Total Steps: {totalSteps}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default App;
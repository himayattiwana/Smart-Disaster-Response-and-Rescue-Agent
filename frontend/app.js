import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
    const [numAgents, setNumAgents] = useState(1);
    const [numSurvivors, setNumSurvivors] = useState(1);
    const [numObstacles, setNumObstacles] = useState(5);
    const [grid, setGrid] = useState(null);
    const [agentPositions, setAgentPositions] = useState({});
    const [rescueStatus, setRescueStatus] = useState({});

    const generateGrid = async () => {
        try {
            const response = await axios.post('http://127.0.0.1:5000/setup', {
                num_agents: numAgents,
                num_survivors: numSurvivors,
                num_obstacles: numObstacles
            });
            const data = response.data;
            setGrid(data.grid);
            setAgentPositions(data.agent_positions || {});
            setRescueStatus({});
        } catch (error) {
            console.error('Error setting up grid:', error);
            setGrid(null);
        }
    };

    const moveAgent = async (agentId) => {
        try {
            const response = await axios.post('http://127.0.0.1:5000/move', {
                agent_id: agentId
            });
            const data = response.data;
            setGrid(data.grid);
            setAgentPositions(prev => ({
                ...prev,
                [agentId]: data.position
            }));
            if (data.completed) {
                setRescueStatus(prev => ({
                    ...prev,
                    [agentId]: `Rescue completed in ${data.total_time} steps!`
                }));
                // Remove agent from grid after rescue
                setAgentPositions(prev => {
                    const newPos = { ...prev };
                    delete newPos[agentId];
                    return newPos;
                });
            }
        } catch (error) {
            console.error('Error moving agent:', error);
        }
    };

    const renderGrid = () => {
        if (!grid || !Array.isArray(grid)) {
            return <p>Grid is not available. Please generate it first.</p>;
        }

        return (
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${grid.length}, 30px)` }}>
                {grid.flat().map((cell, idx) => (
                    <div
                        key={idx}
                        style={{
                            width: 30,
                            height: 30,
                            border: '1px solid #ccc',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            backgroundColor: cell === 'O' ? '#ccc' : cell === 'E' ? '#4CAF50' : 'transparent'
                        }}
                    >
                        {cell === 'A' && '🤖'}
                        {cell === 'S' && <span style={{ fontSize: '0.8em', color: 'red' }}>SOS</span>}
                        {cell === 'H' && '⚠️'}
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div style={{ padding: '20px' }}>
            <h2>🚨 Disaster Response AI Simulation</h2>

            <div>
                <label>Number of Agents: </label>
                <input type="number" value={numAgents} onChange={e => setNumAgents(parseInt(e.target.value) || 1)} min="1" />
            </div>
            <div>
                <label>Number of Survivors: </label>
                <input type="number" value={numSurvivors} onChange={e => setNumSurvivors(parseInt(e.target.value) || 1)} min="1" />
            </div>
            <div>
                <label>Number of Obstacles: </label>
                <input type="number" value={numObstacles} onChange={e => setNumObstacles(parseInt(e.target.value) || 0)} min="0" />
            </div>
            <button onClick={generateGrid}>Generate Grid</button>

            {grid && grid.length > 0 ? renderGrid() : <p>Please generate the grid to start the simulation.</p>}

            {agentPositions && Object.keys(agentPositions).length > 0 && Object.entries(agentPositions).map(([agent, pos]) => (
                <div key={agent}>
                    Agent at {pos[0]},{pos[1]}:
                    <button onClick={() => moveAgent(agent)}>Move</button>
                    {rescueStatus[agent] && <span style={{ marginLeft: '10px', color: 'green' }}>{rescueStatus[agent]}</span>}
                </div>
            ))}
        </div>
    );
}

export default App;

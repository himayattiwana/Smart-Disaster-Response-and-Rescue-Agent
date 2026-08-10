# Smart Disaster Response and Rescue Agent

A grid-world search-and-rescue simulation, built to compare classical AI planning techniques against a simple reactive strategy and watch the difference play out step by step.

Survivors and obstacles are scattered across a 12×12 grid. Rescue agents have to reach the survivors, pick them up, and carry them to one of two exits. You set the number of agents, survivors and obstacles, then step the simulation forward and watch the paths form.

**[Live demo](https://smart-disaster-response-and-rescue-agent-vov6.onrender.com/)**

---

## The algorithms

Three classical techniques, each doing a different job.

**A\* — pathfinding.** Manhattan-distance heuristic on a 4-connected grid, `heapq` priority queue, obstacles excluded from the neighbour expansion. Manhattan is admissible here because movement is orthogonal only, so the paths it returns are genuinely optimal rather than merely plausible. It is also used as a reachability test: a survivor or exit that returns an empty path is treated as unreachable and skipped rather than pursued forever.

**K-means — territory assignment.** Survivor positions are clustered into as many groups as there are agents, so each agent gets a region instead of every agent chasing the same nearest survivor. Written by hand against Manhattan distance rather than pulled from scikit-learn, with centroids seeded from the first *k* survivor positions and ten assign-then-recompute iterations.

**Genetic algorithm — visit ordering.** Within an agent's assigned cluster, the order to visit survivors is a small travelling-salesman problem. The GA represents a candidate as a permutation of that agent's survivors: population of 10, 50 generations, elitism keeping the best two, parents drawn from the top five, single-cut ordered crossover, and swap mutation at a rate of 0.3.

---

## Architecture

There are two layers, and it is worth being clear about which one currently drives what you see.

The **planner** (K-means then the GA) runs when a grid is generated and produces a per-agent visiting order.

The **dispatch loop** in `/api/move` advances the simulation one step at a time. On each step, an agent carrying a survivor paths to the nearest reachable exit; an agent that is empty-handed paths to the nearest reachable survivor. Both use a fresh A\* computation every step, which means the simulation reacts correctly when another agent takes a survivor first.

Right now the animation you watch is the dispatch loop. Feeding the planner's ordering into it — so agents follow an optimised route rather than always chasing the nearest target — is the next piece of work, and is where the interesting comparison lives: greedy-nearest against a clustered, GA-ordered plan, on the same grid, measured in steps taken.

---

## Running it locally

**Backend**

```bash
cd backend
pip install -r requirements.txt
python app.py                 # serves on :5000
```

**Frontend**

```bash
cd frontend
npm install
npm start                     # serves on :3000
```

The dev server proxies API calls to port 5000, so both need to be running.

**As one container**, the way it is deployed:

```bash
docker build -t rescue-agent .
docker run -p 10000:10000 rescue-agent
```

The Dockerfile builds the React app in a Node stage and copies the bundle to where Flask expects to serve it, so a single container serves both the API and the interface.

---

## API

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/generate_grid` | Takes `num_agents`, `num_survivors`, `num_obstacles`; returns the grid, exits, and the starting state of every agent |
| POST | `/api/move` | Advances every active agent one step; returns the updated grid and agent states |
| GET | `/api/health` | Service check |

Agent state carries `position`, `steps`, `carrying` and `completed`, which is what the frontend animates and what you would measure a strategy against.

---

## Layout

```text
backend/
  rescue_ai.py     A*, K-means, genetic algorithm, grid generation
  app.py           Flask API and the step-by-step dispatch loop
frontend/
  src/App.js       React interface and grid visualisation
Dockerfile         Node build stage plus Python runtime
```

---

## Current state

- Simulation state lives in module-level globals, so the server runs one simulation at a time. Fine for a single-user demo, wrong for concurrent users.
- Grid size is fixed at 12×12 in `rescue_ai.py` rather than being a request parameter.
- Agents, survivors and obstacles are placed at random positions without collision checks, so they can occasionally spawn on the same cell.
- `frontend/app.js` is an early prototype that predates the current API and is no longer used; the live interface is `frontend/src/App.js`.

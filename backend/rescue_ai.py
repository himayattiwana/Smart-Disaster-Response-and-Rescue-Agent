import random
import heapq

ROWS, COLS = 12, 12  # Grid size


def manhattan_distance(a, b):
    return abs(a[0] - b[0]) + abs(a[1] - b[1])


def a_star(start, goal, obstacles):
    open_set = []
    heapq.heappush(open_set, (0, start))
    came_from = {}
    g_score = {start: 0}

    while open_set:
        _, current = heapq.heappop(open_set)
        if current == goal:
            path = []
            while current in came_from:
                path.append(current)
                current = came_from[current]
            path.reverse()
            return path

        for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            neighbor = (current[0] + dx, current[1] + dy)
            if (0 <= neighbor[0] < ROWS and 0 <= neighbor[1] < COLS and neighbor not in obstacles):
                tentative_g = g_score[current] + 1
                if tentative_g < g_score.get(neighbor, float('inf')):
                    came_from[neighbor] = current
                    g_score[neighbor] = tentative_g
                    f_score = tentative_g + manhattan_distance(neighbor, goal)
                    heapq.heappush(open_set, (f_score, neighbor))
    return []


def path_cost(path_order, start_pos):
    total_cost = 0
    current = start_pos
    for target in path_order:
        total_cost += manhattan_distance(current, target['position']) * 2  # go + return
        current = start_pos
    return total_cost

def initialize_population(tasks, size):
    return [random.sample(tasks, len(tasks)) for _ in range(size)]

def crossover(parent1, parent2):
    if len(parent1) < 2:
        return parent1[:]
    cut = random.randint(1, max(1, len(parent1) - 2))
    child = parent1[:cut]
    for s in parent2:
        if s not in child:
            child.append(s)
    return child

def mutate(path):
    if len(path) < 2:
        return path
    a, b = random.sample(range(len(path)), 2)
    path[a], path[b] = path[b], path[a]
    return path

def genetic_algorithm(tasks, start_pos, generations=50, population_size=10):
    if len(tasks) <= 1:
        return tasks[:]
    population = initialize_population(tasks, population_size)
    for _ in range(generations):
        population.sort(key=lambda path: path_cost(path, start_pos))
        next_gen = population[:2]
        while len(next_gen) < population_size:
            parent1, parent2 = random.sample(population[:5], 2)
            child = crossover(parent1, parent2)
            if random.random() < 0.3:
                child = mutate(child)
            next_gen.append(child)
        population = next_gen
    return min(population, key=lambda path: path_cost(path, start_pos))


def custom_kmeans_cluster_tasks(tasks, agents, iterations=10):
    survivor_positions = [s['position'] for s in tasks]
    k = len(agents)
    centroids = survivor_positions[:k] if survivor_positions else [(0, 0)] * k

    for _ in range(iterations):
        clusters = [[] for _ in range(k)]
        for s in tasks:
            distances = [manhattan_distance(s['position'], c) for c in centroids]
            min_idx = distances.index(min(distances))
            clusters[min_idx].append(s)
        for i in range(k):
            if clusters[i]:
                xs = [s['position'][0] for s in clusters[i]]
                ys = [s['position'][1] for s in clusters[i]]
                centroids[i] = (round(sum(xs) / len(xs)), round(sum(ys) / len(ys)))

    assignments = {agent: [] for agent in agents}
    for idx, cluster in enumerate(clusters):
        assignments[agents[idx]] = cluster
    return assignments


def generate_grid(num_agents, num_survivors, num_obstacles):
    agents = [(random.randint(0, ROWS - 1), random.randint(0, COLS - 1)) for _ in range(num_agents)]
    survivors = [{'position': (random.randint(0, ROWS - 1), random.randint(0, COLS - 1))} for _ in range(num_survivors)]
    obstacles = [(random.randint(0, ROWS - 1), random.randint(0, COLS - 1)) for _ in range(num_obstacles)]
    exits = [(0, 0), (ROWS - 1, COLS - 1)]
    hazards = obstacles

   
    assignments = custom_kmeans_cluster_tasks(survivors, agents)
    optimized_paths = {}
    for agent in agents:
        tasks = assignments.get(agent, [])
        optimized_order = genetic_algorithm(tasks, agent)
        optimized_paths[agent] = optimized_order

    return {
        'agents': agents,
        'survivors': survivors,
        'obstacles': obstacles,
        'exits': exits,
        'hazards': hazards,
        'size': ROWS,  
        'assignments': optimized_paths  
    }

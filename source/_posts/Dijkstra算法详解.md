---
title: Dijkstra算法详解
date: 2026-4-6 22:46:23
tags: [算法, 图论, 最短路径]
categories: 算法学习
description: 详细讲解Dijkstra算法原理，并提供C++普通版与优先队列优化版代码
comments: true
---

# Dijkstra算法详解及两种代码实现

## 一、算法简介

Dijkstra算法是图论中**单源最短路径**的经典算法，用于计算一个节点到其他所有节点的最短路径。

**主要特点：**
- 适用于**非负权边**的图（有向/无向均可）
- 贪心策略：每次选择距离起点最近且未访问的节点
- 时间复杂度：
  - 普通版：O(n²)（适合稠密图或n<1000）
  - 堆优化版：O(mlogn)（适合稀疏图，m为边数）

**⚠️注意：算法不能处理带有负权边的图！** 若图中有负权边，应使用Bellman-Ford或SPFA算法。

---

## 二、算法核心思想

1. 初始化：
   - 起点距离为0，其他节点距离为无穷大
   - 所有节点标记为未访问

2. 重复以下步骤直到所有节点被访问：
   - 从**未访问节点**中选出距离起点**最近**的节点u
   - 标记u为已访问
   - 遍历u的所有邻居v：
     - 若`dist[u] + w(u,v) < dist[v]`，则更新dist[v]

3. 最终dist数组存储起点到各节点的最短距离
 

---

## 三、代码实现1：普通版（O(n²)）

适合节点数较少（n ≤ 1000）或稠密图的场景。

```cpp
#include<iostream>
#include<vector>
using namespace std;

const int INF = 1e9;
const int N = 1005;
int n, m;
vector<pair<int,int>> g[N]; // g[u] = {v, w}

int dist[N];
bool vis[N];

void dijkstra(int start){
    // 初始化
    for(int i = 1; i <= n; i++){
        dist[i] = INF;
        vis[i] = false;
    }
    dist[start] = 0;
    
    // 主循环：每次选一个节点
    for(int i = 1; i <= n; i++){
        int u = -1;
        
        // 1. 找到未访问中距离最小的节点
        for(int j = 1; j <= n; j++){
            if(!vis[j] && (u == -1 || dist[j] < dist[u])){
                u = j;
            }
        }
        
        // 若剩余节点都不可达，提前退出
        if(dist[u] == INF) break;
        
        vis[u] = true;
        
        // 2. 更新邻居的距离
        for(auto [v, w] : g[u]){
            if(dist[v] > dist[u] + w){
                dist[v] = dist[u] + w;
            }
        }
    }
}

int main(){
    cin >> n >> m;
    for(int i = 0; i < m; i++){
        int u, v, w;
        cin >> u >> v >> w;
        g[u].push_back({v, w});
        // 若为无向图，加上下面一行
        // g[v].push_back({u, w});
    }
    
    dijkstra(1);
    
    for(int i = 1; i <= n; i++){
        cout << dist[i] << " ";
    }
    return 0;
}
```
代码要点：
- 用vis[]数组标记已确定最短路的节点
- 每次暴力扫描所有节点找最小值（O(n)）
- 更新邻居距离（总O(m)）
- 总复杂度O(n² + m)


## 四、代码实现2：堆优化版（O(mlogn)）

使用优先队列快速获取最小节点，适合稀疏图

```cpp
#include<bits/stdc++.h>
using namespace std;

const int INF = 1e9;
const int N = 1005;
int n, m;
vector<pair<int,int>> g[N];

int dist[N];
bool vis[N];

void dijkstra(int start){
    for(int i = 1; i <= n; i++){
        dist[i] = INF;
        vis[i] = false;
    }
    
    // 小根堆：{距离, 节点}
    priority_queue<pair<int, int>, vector<pair<int,int>>, greater<>> pq;
    
    dist[start] = 0;
    pq.push({0, start});
    
    while(!pq.empty()){
        auto [d, u] = pq.top();
        pq.pop();
        
        // 如果已经访问过，跳过（因为可能有旧数据）
        if(vis[u]) continue;
        vis[u] = true;
        
        // 遍历邻居
        for(auto [v, w] : g[u]){
            if(dist[v] > dist[u] + w){
                dist[v] = dist[u] + w;
                pq.push({dist[v], v});  // 可能重复入队，但vis会过滤
            }
        }
    }
}

int main(){
    cin >> n >> m;
    for(int i = 0; i < m; i++){
        int u, v, w;
        cin >> u >> v >> w;
        g[u].push_back({v, w});
        // 无向图加上下面一行
        // g[v].push_back({u, w});
    }
    
    dijkstra(1);
    
    for(int i = 1; i <= n; i++){
        cout << dist[i] << " ";
    }
    return 0;
}
```
优化原理：
- 用优先队列自动维护“当前最近节点”
- 每个节点可能多次入队（当发现更短路径时），但只会处理一次（vis控制）
- 时间复杂度：O(mlogn)（每条边最多导致一次入队操作

## 五、常见问题

 1. 为什么不能处理负权边
Dijkstra的贪心策略基于“已访问节点的距离不会再变小”，但负权边可能导致已访问节点距离被后续节点更新，从而破坏正确性。

 2. 如何处理无向图
在添加边时，同时添加两条有向边：
```cpp
g[u].push_back({v, w});
g[v].push_back({u, w});  // 无向图加上此行
```

 3. 堆优化版为什么需要vis数组？
因为一个节点可能被多次加入优先队列（当找到更短路径时），但第一次出队时已经得到最终最短距离，后续出队应该跳过，避免重复处理。

 4. 起点到某些节点不可达怎么办？
距离保持为INF（初始值），输出时通常根据题意处理（如输出-1或"∞"）。

## 六、总结
Dijkstra是单源非负权最短路的首选算法
- 普通版简单易懂，适合小规模数据
- 堆优化版效率高，是大数据量的标准写法
- 熟练掌握两种写法，根据题目数据范围灵活选择

## 练习题目推荐
- [洛谷 P3371 【模板】单源最短路径（弱化版）](https://www.luogu.com.cn/problem/P3371)
- [洛谷 P4779 【模板】单源最短路径（标准版）](https://www.luogu.com.cn/problem/P4779)
- [LeetCode 743. 网络延迟时间](https://leetcode.cn/problems/network-delay-time/)
---
title: Floyd算法详解
date: 2026-04-13 16:24:00
tags: [算法, 图论, 最短路径]
categories: 算法学习
description: 详细讲解Floyd算法，包括普通实现、路径恢复和连通性判断
comments: true
---

# Floyd算法详解

## 一、算法简介

Floyd算法（也称为Floyd-Warshall算法）是一种经典的**多源最短路径**算法，能够在带权图中计算任意两点之间的最短距离。

主要特点：
- 适用于有向图/无向图、正权或负权边（但不能处理负权回路）
- 使用动态规划思想，直接在邻接矩阵上迭代更新
- 一次算法可得到**所有节点对之间**的最短距离

常见用途：
- 求任意两点间最短路
- 判断图的连通性（或可达性）
- 统计图中最短路径的直径和中心节点

---

## 二、算法复杂度

Floyd算法的核心是三层嵌套循环：

- 外层遍历中间节点`k`
- 中间层遍历起点`i`
- 内层遍历终点`j`

因此时间复杂度：**O(n³)**，其中`n`为节点数。

空间复杂度：**O(n²)**，因为需要保存距离矩阵。

⚠️ 当节点数较大时，Floyd算法不适合处理稠密大图；但对于`n ≤ 400`左右的题目，通常仍然可用。

---

## 三、Floyd算法核心思想

设`dist[i][j]`表示当前已知的从节点`i`到节点`j`的最短距离。

初始状态：
- 若存在边`i->j`，则`dist[i][j]=w(i,j)`
- 若`i==j`，则`dist[i][j]=0`
- 否则`dist[i][j]=INF`

算法逐步考虑允许经过的中间节点：

对于每个中间节点`k`，判断是否可以通过`k`使`i->j`更短：

```
if dist[i][j] > dist[i][k] + dist[k][j]:
    dist[i][j] = dist[i][k] + dist[k][j]
```

这样当外层循环完成后，`dist[i][j]`即为任意两点`i,j`之间的最短距离。

---

## 四、普通版实现（只求距离矩阵）

下面是最基础的Floyd算法实现：

```cpp
#include <bits/stdc++.h>
using namespace std;
const long long INF = 4e18;
int main() {
    int n, m;
    cin >> n >> m;
    vector<vector<long long>> dist(n + 1, vector<long long>(n + 1, INF));

    for (int i = 1; i <= n; i++) {
        dist[i][i] = 0;
    }

    for (int i = 0; i < m; i++) {
        int u, v;
        long long w;
        cin >> u >> v >> w;
        dist[u][v] = min(dist[u][v], w);
        // 如果是无向图，下面再加一行
        // dist[v][u] = min(dist[v][u], w);
    }

    for (int k = 1; k <= n; k++) {
        for (int i = 1; i <= n; i++) {
            for (int j = 1; j <= n; j++) {
                if (dist[i][k] < INF && dist[k][j] < INF) {
                    dist[i][j] = min(dist[i][j], dist[i][k] + dist[k][j]);
                }
            }
        }
    }

    for (int i = 1; i <= n; i++) {
        for (int j = 1; j <= n; j++) {
            if (dist[i][j] >= INF / 2) cout << "INF ";
            else cout << dist[i][j] << " ";
        }
        cout << '\n';
    }

    return 0;
}
```

实现要点：
- `dist`矩阵用于保存当前最短距离
- 三重循环依次引入中间节点并松弛所有路径
- 不能直接使用`INF + INF`，需检查是否可达后再更新

---

## 五、带路径恢复的Floyd实现

仅求最短距离不够，有时还需要输出从`u`到`v`的具体路径。我们可以维护一个`next[i][j]`矩阵：

- `next[i][j]`记录从`i`出发到`j`的下一步节点

初始化时：
- 若存在边`i->j`，`next[i][j] = j`
- 若`i==j`，`next[i][j] = i`
- 否则`next[i][j] = -1`

更新时：

```
if dist[i][j] > dist[i][k] + dist[k][j]:
    dist[i][j] = dist[i][k] + dist[k][j];
    next[i][j] = next[i][k];
```

当构造路径时，先检查`next[u][v]`是否为-1；若不是，则从`u`不断跳到下一节点，直到到达`v`。

```cpp
#include <bits/stdc++.h>
using namespace std;
const long long INF = 4e18;

vector<int> get_path(int u, int v, const vector<vector<int>>& next) {
    if (next[u][v] == -1) return {};
    vector<int> path;
    int cur = u;
    while (cur != v) {
        path.push_back(cur);
        cur = next[cur][v];
        if (cur == -1) return {};
    }
    path.push_back(v);
    return path;
}

int main() {
    int n, m;
    cin >> n >> m;
    vector<vector<long long>> dist(n + 1, vector<long long>(n + 1, INF));
    vector<vector<int>> next(n + 1, vector<int>(n + 1, -1));

    for (int i = 1; i <= n; i++) {
        dist[i][i] = 0;
        next[i][i] = i;
    }

    for (int i = 0; i < m; i++) {
        int u, v;
        long long w;
        cin >> u >> v >> w;
        if (w < dist[u][v]) {
            dist[u][v] = w;
            next[u][v] = v;
        }
        // 无向图则添加 dist[v][u] = min(dist[v][u], w); next[v][u] = u;
    }

    for (int k = 1; k <= n; k++) {
        for (int i = 1; i <= n; i++) {
            for (int j = 1; j <= n; j++) {
                if (dist[i][k] < INF && dist[k][j] < INF && dist[i][j] > dist[i][k] + dist[k][j]) {
                    dist[i][j] = dist[i][k] + dist[k][j];
                    next[i][j] = next[i][k];
                }
            }
        }
    }

    int u, v;
    cin >> u >> v;
    vector<int> path = get_path(u, v, next);
    if (path.empty()) {
        cout << "No path\n";
    } else {
        for (int x : path) cout << x << " ";
        cout << '\n';
    }

    return 0;
}
```

注意：带路径恢复时，`next[i][k]`必须保持来自`i`到`k`的第一跳，而不是来自`k`到`j`的第一跳。

---

## 六、判断连通性的Floyd用法

Floyd算法还可以用来判断图的可达性或连通性。对于无向图：

- 如果最终`dist[i][j] < INF`，说明节点`i`和`j`连通
- 如果某个节点对仍然不可达，则说明图不是连通图

对于有向图，则可以判断强连通性：

- 如果对任意`i,j`都有`dist[i][j] < INF`，说明图是强连通的

基于`dist`矩阵，还可以求：
- 图的连通分量数
- 最远可达距离
- 是否存在负权回路（若`dist[i][i] < 0`则存在）

### 连通性判断代码示例

```cpp
int components = 0;
vector<bool> seen(n + 1, false);
for (int i = 1; i <= n; i++) {
    bool ok = true;
    for (int j = 1; j <= n; j++) {
        if (i != j && dist[i][j] >= INF) {
            ok = false;
            break;
        }
    }
    if (ok) components++;
}
```

对于无向图，只要所有`i,j`满足可达，则图是连通的。

---

## 七、详解与例子

### 1. 为什么需要三重循环

Floyd算法的三重循环对应的是：
- 允许经过的中间节点`k`
- 起点`i`
- 终点`j`

当`k`确定后，`dist[i][j]`表示仅允许经过`1..k`这些节点时的最短距离。随着`k`增加，迭代式地引入更多中间节点，最终得到全局最短路径。

### 2. 例子说明

假设有3个节点的有向图：

```
1 -> 2, 权重 2
2 -> 3, 权重 3
1 -> 3, 权重 10
```

初始距离矩阵：

```
0   2  10
INF 0   3
INF INF 0
```

第一个中间节点`k=1`时：
- `dist[2][3]`不变
- `dist[1][3]`保持10，因为`1->1->3`没有更短

第二个中间节点`k=2`时：
- `dist[1][3]`可通过`1->2->3`更新为5

最终结果：

```
0 2 5
INF 0 3
INF INF 0
```

若需要路径恢复，则`next[1][3]`会从`3`更新为`2`，表示从1到3的第一步是先走到2。

---

## 八、Floyd算法使用建议

- 如果只需要单源最短路，优先选择Dijkstra、SPFA或Bellman-Ford
- 如果需要任意两点最短路，且节点数较小，Floyd是最简单稳定的选择
- 若图有较多边且节点数大，通常应避免直接使用Floyd
- 对于连通性判断、强连通性、负权回路检测，Floyd可以一次性解决多个问题

---

## 九、练习题目推荐

- [洛谷 P2059 【模板】最短路问题](https://www.luogu.com.cn/problem/P2059)
- [洛谷 P2581 【模板】道路修建](https://www.luogu.com.cn/problem/P2581)
- [LeetCode 743. 网络延迟时间](https://leetcode.cn/problems/network-delay-time/)
- [LeetCode 797. 所有可能的路径](https://leetcode.cn/problems/all-paths-from-source-to-target/)
- [力扣 1462. 课程表 IV](https://leetcode.cn/problems/course-schedule-iv/)

---

## 十、总结

Floyd算法适合用于求任意两点最短路径、恢复路径以及连通性分析。它简单、统一，但时间复杂度为`O(n³)`，适合`n`较小的场景。

本文介绍了：
- 普通版Floyd实现
- 带路径恢复的Floyd
- 基于Floyd判断连通性的用法
- 算法复杂度与使用建议


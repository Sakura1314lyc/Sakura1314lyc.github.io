---
title: 'DP进阶①：状态压缩与树上DP'
date: 2026-5-7 15:00:00
tags: [算法, 动态规划, 状态压缩DP, 树上DP, 树形DP]
categories: 算法学习
description: 动态规划进阶篇，深入讲解状态压缩DP和树上DP的核心思想、经典问题及C++代码实现
comments: true
---

# DP进阶①：状态压缩与树上DP

## 一、状态压缩DP（状压DP）

### 1.1 什么是状压DP？

**状态压缩DP** 是指用二进制位（bit）来表示集合状态的一种DP技巧，当状态中每个元素只有"选/不选"两种可能时，可以用一个整数的二进制位来表示整个集合的状态。

**核心思想：**
- 用一个 `n` 位二进制数表示包含 `n` 个元素的集合状态
- 第 `i` 位为 `1` 表示选择了第 `i` 个元素，为 `0` 表示未选择
- 状态总数最多为 `2ⁿ` 种，因此 `n` 通常 ≤ 20

**常用位运算技巧：**

| 操作 | 表达式 | 说明 |
|-----|-------|------|
| 检查第i位是否为1 | `mask >> i & 1` | 为1表示选中 |
| 将第i位设为1 | `mask \| (1 << i)` | 选中第i个 |
| 将第i位设为0 | `mask & ~(1 << i)` | 取消选中 |
| 枚举子集 | `for (int sub = mask; sub; sub = (sub-1) & mask)` | 遍历所有非空子集 |
| 统计1的个数 | `__builtin_popcount(mask)` | GCC内置函数 |

### 1.2 经典问题：最短哈密顿路径

给定一个 `n` 个点的带权无向图，求从起点 `0` 出发，经过每个点恰好一次，到达终点 `n-1` 的最短路径长度。

**状态定义：** `dp[mask][u]` 表示已经经过的点的集合为 `mask`，当前在点 `u` 的最短路径长度。

**转移方程：**
```
dp[mask][u] = min(dp[mask ^ (1<<u)][v] + w[v][u])
```
其中 `v` 在 `mask` 中且 `v ≠ u`，表示从 `v` 走到 `u`。

**时间复杂度：** O(n² · 2ⁿ)

```cpp
#include <iostream>
#include <vector>
#include <cstring>
#include <algorithm>
using namespace std;

const int INF = 0x3f3f3f3f;

int hamiltonianPath(vector<vector<int>>& w) {
    int n = w.size();
    vector<vector<int>> dp(1 << n, vector<int>(n, INF));
    dp[1][0] = 0; // 只经过了起点0，当前在0
    
    for (int mask = 1; mask < (1 << n); mask++) {
        // 只枚举mask中包含的点
        for (int u = 0; u < n; u++) {
            if (!(mask >> u & 1)) continue; // u不在mask中
            if (dp[mask][u] == INF) continue;
            
            for (int v = 0; v < n; v++) {
                if (mask >> v & 1) continue; // v已经过
                if (w[u][v] == INF) continue; // 无边
                int next = mask | (1 << v);
                dp[next][v] = min(dp[next][v], dp[mask][u] + w[u][v]);
            }
        }
    }
    return dp[(1 << n) - 1][n - 1]; // 所有点都经过，终点为n-1
}

int main() {
    int n = 4;
    vector<vector<int>> w = {
        {0, 2, 1, 3},
        {2, 0, 4, INF},
        {1, 4, 0, 5},
        {3, INF, 5, 0}
    };
    int ans = hamiltonianPath(w);
    if (ans >= INF) cout << "无解" << endl;
    else cout << "最短哈密顿路径: " << ans << endl;
    return 0;
}
```

### 1.3 经典问题：旅行商问题（TSP）

TSP与最短哈密顿路径的区别：TSP要求最后回到起点，形成一个环。

**解法：** 在哈密顿路径的基础上，最后加上 `dist[n-1][0]` 即可。或者修改终态条件。

```cpp
int tsp(vector<vector<int>>& dist) {
    int n = dist.size();
    vector<vector<int>> dp(1 << n, vector<int>(n, INF));
    dp[1][0] = 0;
    
    for (int mask = 1; mask < (1 << n); mask++) {
        for (int u = 0; u < n; u++) {
            if (!(mask >> u & 1)) continue;
            if (dp[mask][u] == INF) continue;
            
            for (int v = 0; v < n; v++) {
                if (mask >> v & 1) continue;
                if (dist[u][v] == INF) continue;
                dp[mask | (1 << v)][v] = min(dp[mask | (1 << v)][v], 
                                              dp[mask][u] + dist[u][v]);
            }
        }
    }
    
    // 回到起点
    int full = (1 << n) - 1;
    int ans = INF;
    for (int i = 1; i < n; i++) {
        if (dist[i][0] != INF)
            ans = min(ans, dp[full][i] + dist[i][0]);
    }
    return ans;
}
```

### 1.4 经典问题：集合划分/分配问题

**问题描述：** 有 `n` 个人和 `n` 项任务，每个人做每项任务的效率不同，求最优分配使得总效率最大。

**状态定义：** `dp[mask]` 表示已经分配了 `mask` 中标记的任务时的最大收益。
- 当 `mask` 中有 `k` 个 `1` 时，表示已经分配给了前 `k` 个人

```cpp
#include <iostream>
#include <vector>
using namespace std;

int assignment(vector<vector<int>>& cost) {
    int n = cost.size(); // n个人，n项任务
    vector<int> dp(1 << n, -1);
    dp[0] = 0;
    
    for (int mask = 0; mask < (1 << n); mask++) {
        int k = __builtin_popcount(mask); // 已分配的人数（也是已分配的任务数）
        if (dp[mask] < 0) continue;
        
        for (int j = 0; j < n; j++) {
            if (mask >> j & 1) continue; // 任务j已被分配
            int next = mask | (1 << j);
            dp[next] = max(dp[next], dp[mask] + cost[k][j]);
        }
    }
    return dp[(1 << n) - 1];
}

int main() {
    vector<vector<int>> cost = {
        {9, 2, 7},
        {6, 4, 3},
        {5, 8, 1}
    };
    cout << "最大收益: " << assignment(cost) << endl;
    // 最优分配: 人0→任务1(2), 人1→任务2(3), 人2→任务0(5), 合计=10
    return 0;
}
```

### 1.5 子集枚举的优化技巧

在状压DP中经常需要枚举子集，以下枚举方式的总复杂度为 O(3ⁿ)：

```cpp
// 枚举mask的所有非空子集
for (int sub = mask; sub; sub = (sub - 1) & mask) {
    // sub 是 mask 的一个非空子集
}

// 枚举时同时得到补集
for (int sub = mask; sub; sub = (sub - 1) & mask) {
    int complement = mask ^ sub; // 补集
    // 处理 sub 和 complement
}
```

**常见优化：** 预处理所有合法状态，跳过非法状态。

---

## 二、树上DP（树形DP）

### 2.1 什么是树上DP？

**树上DP** 是指在树结构上进行动态规划，利用树的递归性质，通过 DFS 遍历，用子节点的状态来更新父节点的状态。

**两类遍历方式：**
- **自顶向下**：从根到叶子（记忆化搜索）
- **自底向上**：从叶子到根（DFS后序遍历）→ **最常用**

### 2.2 经典问题：树的最大独立集

给定一棵树，选择尽可能多的节点，使得任意两个被选中的节点不相邻（没有直接边相连）。

**状态定义：**
- `dp[u][0]` 表示不选节点 `u` 时，以 `u` 为根的子树的最大独立集大小
- `dp[u][1]` 表示选节点 `u` 时，以 `u` 为根的子树的最大独立集大小

**转移方程：**
```
dp[u][0] = sum(max(dp[v][0], dp[v][1]))   // u不选，子节点可选可不选
dp[u][1] = 1 + sum(dp[v][0])               // u选了，子节点都不能选
```

```cpp
#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

vector<vector<int>> adj;
vector<int> vis;
vector<vector<int>> dp;

void dfs(int u) {
    vis[u] = 1;
    dp[u][0] = 0; // 不选u
    dp[u][1] = 1; // 选u
    
    for (int v : adj[u]) {
        if (vis[v]) continue;
        dfs(v);
        dp[u][0] += max(dp[v][0], dp[v][1]);
        dp[u][1] += dp[v][0];
    }
}

int maxIndependentSet(int n, vector<pair<int,int>>& edges) {
    adj.assign(n, vector<int>());
    vis.assign(n, 0);
    dp.assign(n, vector<int>(2, 0));
    
    for (auto& e : edges) {
        adj[e.first].push_back(e.second);
        adj[e.second].push_back(e.first);
    }
    
    dfs(0); // 假设0为根
    return max(dp[0][0], dp[0][1]);
}

int main() {
    // 0-1-2-3 链状树
    vector<pair<int,int>> edges = {{0,1}, {1,2}, {2,3}};
    cout << "最大独立集: " << maxIndependentSet(4, edges) << endl; // 输出: 2 ({0,2}或{1,3})
    return 0;
}
```

### 2.3 经典问题：树的最小点覆盖

选最少的节点，使得每条边至少有一个端点被选中。

**状态定义：**
- `dp[u][0]`：不选u，覆盖u子树的最小点数
- `dp[u][1]`：选u，覆盖u子树的最小点数

**转移方程：**
```
dp[u][0] = sum(dp[v][1])            // u不选，子节点v必须选
dp[u][1] = 1 + sum(min(dp[v][0], dp[v][1]))  // u选了，子节点可选可不选
```

```cpp
void dfs_cover(int u) {
    vis[u] = 1;
    dp[u][0] = 0;
    dp[u][1] = 1;
    
    for (int v : adj[u]) {
        if (vis[v]) continue;
        dfs_cover(v);
        dp[u][0] += dp[v][1];
        dp[u][1] += min(dp[v][0], dp[v][1]);
    }
}

int minVertexCover(int n, vector<pair<int,int>>& edges) {
    adj.assign(n, vector<int>());
    vis.assign(n, 0);
    dp.assign(n, vector<int>(2, 0));
    
    for (auto& e : edges) {
        adj[e.first].push_back(e.second);
        adj[e.second].push_back(e.first);
    }
    
    dfs_cover(0);
    return min(dp[0][0], dp[0][1]);
}
```

### 2.4 经典问题：树的直径（最长路径）

找树中距离最远的两个节点之间的距离。

**思路：** 对每个节点，计算经过它的最长路径 = 最深的两棵子树深度之和。

```cpp
int diameter = 0;

int dfs_diameter(int u, int parent) {
    int maxDepth = 0;       // u的子树中的最大深度
    int secondMaxDepth = 0; // 次大深度
    
    for (int v : adj[u]) {
        if (v == parent) continue;
        int depth = dfs_diameter(v, u) + 1;
        
        if (depth > maxDepth) {
            secondMaxDepth = maxDepth;
            maxDepth = depth;
        } else if (depth > secondMaxDepth) {
            secondMaxDepth = depth;
        }
    }
    
    // 经过u的最长路径 = maxDepth + secondMaxDepth
    diameter = max(diameter, maxDepth + secondMaxDepth);
    return maxDepth; // 返回u子树的最大深度
}

int treeDiameter(int n, vector<pair<int,int>>& edges) {
    adj.assign(n, vector<int>());
    for (auto& e : edges) {
        adj[e.first].push_back(e.second);
        adj[e.second].push_back(e.first);
    }
    diameter = 0;
    dfs_diameter(0, -1);
    return diameter;
}
```

### 2.5 经典问题：树上背包（树形DP + 分组背包）

**问题描述：** 有 `n` 门课程，每门课程有学分，有些课程有先修课程（必须先学某课程才能学这门）。求在选 `m` 门课程的情况下能获得的最大学分。

**思路：** 将先修关系建成树（或森林），添加虚拟根节点 `0`。对每个节点做分组背包：
- `dp[u][j]` 表示在以 `u` 为根的子树中选 `j` 门课的最大学分

```cpp
#include <iostream>
#include <vector>
#include <cstring>
using namespace std;

vector<vector<int>> children;
vector<int> score;
vector<vector<int>> dp;
int n, m;

void dfs(int u) {
    dp[u][1] = score[u]; // 只选u自己
    
    for (int v : children[u]) {
        dfs(v);
        // 分组背包：u的每个子节点是一组
        // 枚举当前总选课数（从大到小，保证不重复选）
        for (int j = m; j >= 2; j--) {
            for (int k = 1; k < j; k++) {
                // 在子树v中选k门，在其它子树和u中选j-k门
                dp[u][j] = max(dp[u][j], dp[u][j - k] + dp[v][k]);
            }
        }
    }
}

int knapsackOnTree(int N, int M, vector<int>& scores, vector<int>& prereq) {
    n = N;
    m = M;
    score = scores;
    children.assign(n + 1, vector<int>());
    dp.assign(n + 1, vector<int>(m + 1, -1e9));
    
    // 建树：0为虚拟根（无学分）
    for (int i = 1; i <= n; i++) {
        int p = prereq[i - 1]; // 先修课程
        children[p].push_back(i);
    }
    
    // 以虚拟根开始
    dp[0][0] = 0;
    for (int v : children[0]) {
        dfs(v);
        // 同样用分组背包
        for (int j = m; j >= 1; j--) {
            for (int k = 1; k <= j; k++) {
                dp[0][j] = max(dp[0][j], dp[0][j - k] + dp[v][k]);
            }
        }
    }
    
    int ans = 0;
    for (int j = 0; j <= m; j++)
        ans = max(ans, dp[0][j]);
    return ans;
}
```

### 2.6 树上DP常见模型总结

| 问题类型 | 状态定义 | 转移特点 | 时间复杂度 |
|---------|---------|---------|-----------|
| 最大独立集 | `dp[u][0/1]` 选/不选 | 选u则子都不选 | O(n) |
| 最小点覆盖 | `dp[u][0/1]` 选/不选 | 不选u则子必须选 | O(n) |
| 树的直径 | 最深+次深子树 | 合并子树深度 | O(n) |
| 树上背包 | `dp[u][j]` u子树选j个 | 分组背包合并 | O(n·m²) |
| 树的最长路径 | 根到叶的最远距离 | 取max子节点+1 | O(n) |
| 树的重心 | 子树大小 | 统计最大子树大小 | O(n) |

---

## 三、状压DP与树上DP的对比

| 对比维度 | 状态压缩DP | 树上DP |
|---------|-----------|--------|
| 状态表示 | 二进制mask表示集合 | 树节点+状态维度 |
| 转移方式 | 加入/移除元素 | 合并子节点信息 |
| 适用场景 | 集合划分、排列问题 | 树/森林结构的问题 |
| 典型n | n ≤ 20 | n ≤ 10⁵ |
| 时间复杂度 | O(2ⁿ · poly(n)) | O(n · poly(k)) |
| 优化方向 | 剪枝、对称性 | 换根DP、重链剖分 |

---

## 四、更多练习

**状压DP：**
1. [LeetCode 464. 我能赢吗](https://leetcode.cn/problems/can-i-win/)
2. [AcWing 91. 最短Hamilton路径](https://www.acwing.com/problem/content/93/)
3. [LeetCode 1879. 两个数组最小的异或值之和](https://leetcode.cn/problems/minimum-xor-sum-of-two-arrays/)
4. [洛谷 P1433. 吃奶酪](https://www.luogu.com.cn/problem/P1433)

**树上DP：**
1. [LeetCode 337. 打家劫舍 III](https://leetcode.cn/problems/house-robber-iii/)（最大独立集）
2. [LeetCode 124. 二叉树中的最大路径和](https://leetcode.cn/problems/binary-tree-maximum-path-sum/)
3. [AcWing 285. 没有上司的舞会](https://www.acwing.com/problem/content/287/)（最大独立集）
4. [洛谷 P2014. 选课](https://www.luogu.com.cn/problem/P2014)（树上背包）

---

*下一篇预告：DP进阶② — 数位DP与期望DP，敬请期待！*

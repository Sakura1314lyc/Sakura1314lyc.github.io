---
title: DP入门：线性DP与区间DP
date: 2026-5-7 14:00:00
tags: [算法, 动态规划, 线性DP, 区间DP]
categories: 算法学习
description: 动态规划入门指南，详细讲解线性DP和区间DP的核心思想、经典问题及C++代码实现
comments: true
---

# DP入门：线性DP与区间DP

## 一、什么是动态规划？

**动态规划（Dynamic Programming，DP）** 是一种通过把原问题分解为相对简单的子问题，并利用子问题的解来求解原问题的优化方法。

**核心思想：**
- **最优子结构**：大问题的最优解包含子问题的最优解
- **重叠子问题**：子问题会被重复计算，用记忆化避免重复
- **无后效性**：某阶段的状态一旦确定，就不受后续决策影响

**DP解题三步曲：**
1. **定义状态** — 用数组表示什么
2. **找出状态转移方程** — 如何从前面的状态推到当前状态
3. **确定初始条件与边界** — 最小子问题的解是什么

---

## 二、线性DP

**线性DP** 是最基础的一类DP，状态沿着一个方向（如数组下标）线性递推。

### 经典问题1：最长上升子序列（LIS）

给定一个长度为 `n` 的数组，求最长的严格递增子序列的长度。

**状态定义：** `dp[i]` 表示以 `nums[i]` 结尾的最长上升子序列长度。

**转移方程：**
```
dp[i] = max(dp[j] + 1)  (j < i 且 nums[j] < nums[i])
```

**时间复杂度：** O(n²)，可用贪心+二分优化到 O(n log n)。

```cpp
#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

// O(n²) 朴素解法
int lengthOfLIS_n2(vector<int>& nums) {
    int n = nums.size();
    vector<int> dp(n, 1);
    int ans = 1;
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < i; j++) {
            if (nums[j] < nums[i]) {
                dp[i] = max(dp[i], dp[j] + 1);
            }
        }
        ans = max(ans, dp[i]);
    }
    return ans;
}

// O(n log n) 贪心+二分优化
int lengthOfLIS(vector<int>& nums) {
    vector<int> tails; // tails[k] = 长度为k+1的IS的最小末尾值
    for (int x : nums) {
        auto it = lower_bound(tails.begin(), tails.end(), x);
        if (it == tails.end())
            tails.push_back(x);
        else
            *it = x;
    }
    return tails.size();
}

int main() {
    vector<int> nums = {10, 9, 2, 5, 3, 7, 101, 18};
    cout << "LIS长度: " << lengthOfLIS(nums) << endl; // 输出: 4 (2,3,7,101)
    return 0;
}
```

### 经典问题2：最长公共子序列（LCS）

给定两个字符串 `text1` 和 `text2`，求它们的最长公共子序列长度。

**状态定义：** `dp[i][j]` 表示 `text1[0..i-1]` 和 `text2[0..j-1]` 的最长公共子序列长度。

**转移方程：**
```
dp[i][j] = dp[i-1][j-1] + 1                (text1[i-1] == text2[j-1])
dp[i][j] = max(dp[i-1][j], dp[i][j-1])     (text1[i-1] != text2[j-1])
```

```cpp
#include <iostream>
#include <string>
#include <vector>
using namespace std;

int longestCommonSubsequence(string text1, string text2) {
    int n = text1.size(), m = text2.size();
    vector<vector<int>> dp(n + 1, vector<int>(m + 1, 0));
    
    for (int i = 1; i <= n; i++) {
        for (int j = 1; j <= m; j++) {
            if (text1[i - 1] == text2[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1] + 1;
            } else {
                dp[i][j] = max(dp[i - 1][j], dp[i][j - 1]);
            }
        }
    }
    return dp[n][m];
}

int main() {
    string s1 = "abcde", s2 = "ace";
    cout << "LCS长度: " << longestCommonSubsequence(s1, s2) << endl; // 输出: 3 ("ace")
    return 0;
}
```

### 经典问题3：最大子段和

求数组中连续子数组的最大和。

**状态定义：** `dp[i]` 表示以 `nums[i]` 结尾的最大子段和。

**转移方程：**
```
dp[i] = max(nums[i], dp[i-1] + nums[i])
```

这实际上就是 **Kadane算法**，可以优化到仅用 O(1) 空间。

```cpp
#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

int maxSubArray(vector<int>& nums) {
    int cur = 0, ans = INT_MIN;
    for (int x : nums) {
        cur = max(x, cur + x);
        ans = max(ans, cur);
    }
    return ans;
}

int main() {
    vector<int> nums = {-2, 1, -3, 4, -1, 2, 1, -5, 4};
    cout << "最大子段和: " << maxSubArray(nums) << endl; // 输出: 6 (4,-1,2,1)
    return 0;
}
```

### 线性DP小结

| 问题 | 状态维度 | 时间复杂度 | 空间优化 |
|------|---------|-----------|---------|
| LIS | 1维 | O(n²) → O(n log n) | 贪心数组 |
| LCS | 2维 | O(nm) | 滚动数组→O(m) |
| 最大子段和 | 1维 | O(n) | O(1) |

---

## 三、区间DP

**区间DP** 的状态表示的是序列上的一个区间 `[l, r]`，大区间由小区间合并得到。

**特点：**
- 状态通常为 `dp[l][r]` 表示区间 `[l, r]` 上的最优解
- 按 **区间长度** 从小到大递推
- 转移时枚举区间内的分割点 `k`，合并左右子区间

### 经典问题1：石子合并

有 `n` 堆石子排成一排，每次只能合并相邻的两堆，合并的代价为两堆石子数之和。求将所有石子合并为一堆的最小总代价。

**状态定义：** `dp[l][r]` 表示合并区间 `[l, r]` 内的石子的最小代价。

**转移方程：**
```
dp[l][r] = min(dp[l][k] + dp[k+1][r] + sum[l][r])  (l ≤ k < r)
```

其中 `sum[l][r]` 是区间 `[l, r]` 的石子总数，可用前缀和 O(1) 计算。

```cpp
#include <iostream>
#include <vector>
#include <climits>
using namespace std;

int mergeStones(vector<int>& stones) {
    int n = stones.size();
    vector<int> prefix(n + 1, 0);
    for (int i = 1; i <= n; i++)
        prefix[i] = prefix[i - 1] + stones[i - 1];
    
    auto sum = [&](int l, int r) {
        return prefix[r + 1] - prefix[l];
    };
    
    // dp[l][r] 合并区间[l,r]的最小代价
    vector<vector<int>> dp(n, vector<int>(n, 0));
    
    // len从2开始，长度为1的区间代价为0
    for (int len = 2; len <= n; len++) {
        for (int l = 0; l + len - 1 < n; l++) {
            int r = l + len - 1;
            dp[l][r] = INT_MAX;
            for (int k = l; k < r; k++) {
                dp[l][r] = min(dp[l][r], 
                               dp[l][k] + dp[k + 1][r] + sum(l, r));
            }
        }
    }
    return dp[0][n - 1];
}

int main() {
    vector<int> stones = {4, 2, 3, 6};
    cout << "最小合并代价: " << mergeStones(stones) << endl; 
    // 输出示例: (4+2)=6 → {6,3,6} → (6+3)=9 → {9,6} → (9+6)=15, 总:6+9+15=30
    return 0;
}
```

### 经典问题2：回文子串

给定一个字符串，求最少插入多少个字符使其变成回文串。

**状态定义：** `dp[l][r]` 表示使 `s[l..r]` 变成回文串所需的最少插入次数。

**转移方程：**
```
dp[l][r] = dp[l+1][r-1]               (s[l] == s[r])
dp[l][r] = min(dp[l+1][r], dp[l][r-1]) + 1  (s[l] != s[r])
```

```cpp
#include <iostream>
#include <string>
#include <vector>
#include <algorithm>
using namespace std;

int minInsertions(string s) {
    int n = s.size();
    vector<vector<int>> dp(n, vector<int>(n, 0));
    
    // 按区间长度从小到大
    for (int len = 2; len <= n; len++) {
        for (int l = 0; l + len - 1 < n; l++) {
            int r = l + len - 1;
            if (s[l] == s[r]) {
                dp[l][r] = dp[l + 1][r - 1];
            } else {
                dp[l][r] = min(dp[l + 1][r], dp[l][r - 1]) + 1;
            }
        }
    }
    return dp[0][n - 1];
}

int main() {
    string s = "leetcode";
    cout << "最少插入次数: " << minInsertions(s) << endl; 
    // 输出: 5 ("leetcodocteel" 或类似回文)
    return 0;
}
```

### 区间DP的四边形不等式优化

当区间DP的转移满足**四边形不等式**时，可以将枚举分割点的范围从 `[l, r-1]` 缩小到 `[opt[l][r-1], opt[l+1][r]]`，将 O(n³) 优化为 O(n²)。

```cpp
// 石子合并的四边形不等式优化
int mergeStonesOptimized(vector<int>& stones) {
    int n = stones.size();
    vector<int> prefix(n + 1, 0);
    for (int i = 1; i <= n; i++)
        prefix[i] = prefix[i - 1] + stones[i - 1];
    
    auto sum = [&](int l, int r) {
        return prefix[r + 1] - prefix[l];
    };
    
    vector<vector<int>> dp(n, vector<int>(n, 0));
    vector<vector<int>> opt(n, vector<int>(n, 0)); // 最优分割点
    
    // 初始化：长度为1的区间最优分割点为自己
    for (int i = 0; i < n; i++)
        opt[i][i] = i;
    
    for (int len = 2; len <= n; len++) {
        for (int l = 0; l + len - 1 < n; l++) {
            int r = l + len - 1;
            dp[l][r] = INT_MAX;
            // 在 [opt[l][r-1], opt[l+1][r]] 范围内枚举
            for (int k = opt[l][r - 1]; k <= opt[l + 1][r]; k++) {
                if (k < r) {
                    int val = dp[l][k] + dp[k + 1][r] + sum(l, r);
                    if (val < dp[l][r]) {
                        dp[l][r] = val;
                        opt[l][r] = k;
                    }
                }
            }
        }
    }
    return dp[0][n - 1];
}
```

### 区间DP小结

| 问题类型 | 转移方式 | 基础复杂度 | 优化后 |
|---------|---------|-----------|-------|
| 合并类 | 枚举分割点k | O(n³) | O(n²) 四边形不等式 |
| 回文类 | 两端向内缩 | O(n²) | — |
| 括号匹配 | 枚举分割点k | O(n³) | O(n²) |

---

## 四、线性DP vs 区间DP

| 对比维度 | 线性DP | 区间DP |
|---------|--------|-------|
| 状态维度 | 1维或2维单向递推 | 2维区间 [l, r] |
| 递推方向 | 从小到大（下标递增） | 按区间长度从小到大 |
| 转移方式 | 从前面的位置转移到当前位置 | 从子区间合并到当前区间 |
| 经典问题 | LIS, LCS, 最大子段和 | 石子合并, 回文子串 |
| 空间复杂度 | O(n) 或 O(nm) | O(n²) |
| 时间复杂度 | O(n) ~ O(n²) | O(n²) ~ O(n³) |

---

## 五、练习题推荐

**线性DP：**
1. [LeetCode 300. 最长递增子序列](https://leetcode.cn/problems/longest-increasing-subsequence/)
2. [LeetCode 1143. 最长公共子序列](https://leetcode.cn/problems/longest-common-subsequence/)
3. [LeetCode 53. 最大子数组和](https://leetcode.cn/problems/maximum-subarray/)
4. [LeetCode 72. 编辑距离](https://leetcode.cn/problems/edit-distance/)

**区间DP：**
1. [LeetCode 1312. 让字符串成为回文串的最少插入次数](https://leetcode.cn/problems/minimum-insertion-steps-to-make-a-string-palindrome/)
2. [洛谷 P1880. 石子合并](https://www.luogu.com.cn/problem/P1880)
3. [LeetCode 312. 戳气球](https://leetcode.cn/problems/burst-balloons/)
4. [LeetCode 516. 最长回文子序列](https://leetcode.cn/problems/longest-palindromic-subsequence/)

---

*下一篇预告：DP进阶① — 状态压缩DP与树上DP，敬请期待！*

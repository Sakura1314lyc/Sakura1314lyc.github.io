---
title: "Go slice 截取 vs copy 的区别详解"
date: 2026-03-20 14:30:00
tags:
  - Go
  - slice
  - 编程
  - 深浅拷贝
categories:
  - Go语言
comments: true
---

# Go slice 截取 vs copy 的区别详解

在 Go 语言中，`slice` 是一个非常常用的数据结构，但它的行为和底层数组紧密相关。很多初学者在截取或复制 slice 时容易混淆“浅拷贝”和“深拷贝”。本文就来详细讲讲 **slice 截取 vs copy 的区别**，并附上示例代码。

---

## 1️⃣ slice 截取（Slice Operation）

Go 中对 slice 进行截取，只是创建了一个 **新的 slice 描述符**，它 **指向原来的底层数组**。  

```go
package main

import "fmt"

func main() {
    original := []int{1, 2, 3, 4, 5}
    slice1 := original[1:4] // [2,3,4]

    // 修改 slice1 内的元素
    slice1[0] = 20

    fmt.Println("original:", original) // [1,20,3,4,5]
    fmt.Println("slice1:", slice1)     // [20,3,4]

    // 扩容 append
    slice2 := append(slice1, 6)
    fmt.Println("slice2:", slice2)     // [20,3,4,6]
}
```
✅ 特点：
- 截取 不会创建新的底层数组，共享原数组。
- 修改 slice1 的元素 → 会影响 original。
- append 导致扩容 → 可能创建新的数组，不再影响原 slice。

## 2️⃣ 使用 copy 拷贝 slice

copy 可以把 slice 的元素复制到新的 slice，形成**独立**的底层数组

```go
package main

import "fmt"

func main() {
    original := []int{1, 2, 3, 4, 5}
    slice2 := make([]int, 3)
    copy(slice2, original[1:4]) // 拷贝 [2,3,4] 到 slice2

    slice2[0] = 100

    fmt.Println("original:", original) // [1,2,3,4,5]
    fmt.Println("slice2:", slice2)     // [100,3,4]
}
```

✅ 特点：
- slice2 有独立的底层数组，不共享原 slice。
- 修改 slice2 不会影响 original。
- 对基本类型而言，这可以视为 深拷贝；如果 slice 内是引用类型，只是拷贝指针

## 3️⃣ 对比总结
|操作|底层数组|修改是否影响原slice|说明|
|---|---|---|---|
|截取 slice|共享|会影响|浅拷贝，只复制 slice 描述符|
|copy|独立|不影响|深拷贝，拷贝元素到新数组|

## 4️⃣ 总结
- 截取 slice：轻量，性能高，但修改会影响原数组。
- copy slice：创建独立数组，安全，但需要额外内存。
- 选择时机：
- 需要共享数据，或临时操作 → 用截取。
- 需要独立数据，不想影响原数组 → 用 copy。
理解了底层数组与 slice 的关系，你就能更安全、更高效地使用 Go 的 slice 了

## 💡 延伸阅读：
- Go 官方 slice 文档：https://golang.org/pkg/builtin/#append
- Go 深浅拷贝详解：https://golang.org/doc/effective_go.html#slices
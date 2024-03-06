### 1. [Two Sum](https://leetcode.com/problems/two-sum/) 



```go
func twoSum(nums []int, target int) []int {
	mp := make(map[int]int)
	for i := range nums {
		remaining := target - nums[i]
		if idx, ok := mp[remaining]; ok {
			return []int{idx, i}
		}
		mp[nums[i]] = i
	}
	return []int{}
}
```



### 2. [Add Two Numbers](https://leetcode.com/problems/add-two-numbers/) 



```go
/**
 * Definition for singly-linked list.
 * type ListNode struct {
 *     Val int
 *     Next *ListNode
 * }
 */
func addTwoNumbers(l1 *ListNode, l2 *ListNode) *ListNode {
    dummy := &ListNode{}
    tail := dummy
    carry := 0
    for l1 != nil || l2 != nil || carry != 0 {
        v1, v2 := 0, 0
        if l1 != nil {
            v1 = l1.Val
            l1 = l1.Next
        }
        if l2 != nil {
            v2 = l2.Val
            l2 = l2.Next
        }
        sum := v1 + v2 + carry
        carry = sum / 10
        tail.Next = &ListNode{Val: sum % 10}
        tail = tail.Next
    }
    return dummy.Next
}
```



### 3. [Longest Substring Without Repeating Characters](https://leetcode.com/problems/longest-substring-without-repeating-characters/) 



```go
func lengthOfLongestSubstring(s string) int {
    mp := make(map[byte]int)
    left := 0
    ans := 0
    for i := range s {
        if idx, ok := mp[s[i]]; ok {
            left = max(left, idx+1)
        }
        mp[s[i]] = i
        ans = max(ans, i-left+1)
    }
    return ans
}
```



### 4. [Median of Two Sorted Arrays](https://leetcode.com/problems/median-of-two-sorted-arrays/) 



```go
func findMedianSortedArrays(nums1 []int, nums2 []int) float64 {
    sz := len(nums1) + len(nums2)
    if sz % 2 == 1 {
        return float64(getKthElement(nums1, nums2, sz/2 + 1))
    } else {
        return float64(getKthElement(nums1, nums2, sz/2) + getKthElement(nums1, nums2, sz/2 + 1)) / 2.0
    }
}

func getKthElement(nums1 []int, nums2 []int, k int) int {
    index1, index2 := 0, 0
    for {
        if index1 == len(nums1) {
            return nums2[index2+k-1]
        }
        if index2 == len(nums2) {
            return nums1[index1+k-1]
        }
        if k == 1 {
            return min(nums1[index1], nums2[index2])
        }
        newIndex1 := min(index1 + k/2, len(nums1)) - 1
        newIndex2 := min(index2 + k/2, len(nums2)) - 1
        if nums1[newIndex1] < nums2[newIndex2] {
            k -= newIndex1 - index1 + 1
            index1 = newIndex1 + 1
        } else {
            k -= newIndex2 - index2 + 1
            index2 = newIndex2 + 1
        }
    }
    return 0
}
```
















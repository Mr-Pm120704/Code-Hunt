/**
 * Database Seeder for Code Hunt
 * Run: node src/seed.js
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const problems = [
  // ── 1st Year ───────────────────────────────────────────────────────
  {
    title: 'Two Sum',
    description: `Given an array of integers \`nums\` and an integer \`target\`, return the indices of the two numbers that add up to \`target\`.

**Example:**
- Input:
  \`4\` (array length)
  \`2 7 11 15\` (array elements)
  \`9\` (target)
- Output: \`[0, 1]\`

**Constraints:**
- Each input has exactly one solution
- You may not use the same element twice`,
    difficulty: 'Easy',
    category: 'Arrays',
    year: '1st Year',
    functionName: 'Main',
    starterCode: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        if (!scanner.hasNextInt()) return;
        int n = scanner.nextInt();
        int[] nums = new int[n];
        for (int i = 0; i < n; i++) {
            nums[i] = scanner.nextInt();
        }
        int target = scanner.nextInt();
        
        Solution sol = new Solution();
        int[] result = sol.twoSum(nums, target);
        System.out.println("[" + result[0] + ", " + result[1] + "]");
    }
}

class Solution {
    public int[] twoSum(int[] nums, int target) {
        // Write your logic here
        
        return new int[]{0, 0};
    }
}
`,
    testCases: JSON.stringify([
      { input: '4\n2 7 11 15\n9\n', output: '[0, 1]' },
      { input: '3\n3 2 4\n6\n', output: '[1, 2]' },
      { input: '2\n3 3\n6\n', output: '[0, 1]' },
    ]),
  },
  {
    title: 'Reverse String',
    description: `Write a function that reverses a string.

**Example:**
- Input: \`hello\`
- Output: \`olleh\`
`,
    difficulty: 'Easy',
    category: 'Strings',
    year: '1st Year',
    functionName: 'Main',
    starterCode: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        if (!scanner.hasNextLine()) return;
        String s = scanner.nextLine();
        
        Solution sol = new Solution();
        System.out.println(sol.reverseString(s));
    }
}

class Solution {
    public String reverseString(String s) {
        // Write your logic here
        
        return s;
    }
}
`,
    testCases: JSON.stringify([
      { input: 'hello\n', output: 'olleh' },
      { input: 'world\n', output: 'dlrow' },
      { input: 'racecar\n', output: 'racecar' },
    ]),
  },
  {
    title: 'Multiplication Table',
    description: `Given an integer \`n\`, print the multiplication table from 1 to 10 for that number.

**Example:**
- Input: \`5\`
- Output:
  \`5 x 1 = 5\`
  \`5 x 2 = 10\`
  ...
  \`5 x 10 = 50\``,
    difficulty: 'Easy',
    category: 'Loops',
    year: '1st Year',
    functionName: 'Main',
    starterCode: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        if (!scanner.hasNextInt()) return;
        int n = scanner.nextInt();
        
        Solution sol = new Solution();
        sol.printMultiplicationTable(n);
    }
}

class Solution {
    public void printMultiplicationTable(int n) {
        // Write your logic here
        
    }
}
`,
    testCases: JSON.stringify([
      { input: '5\n', output: '5 x 1 = 5\n5 x 2 = 10\n5 x 3 = 15\n5 x 4 = 20\n5 x 5 = 25\n5 x 6 = 30\n5 x 7 = 35\n5 x 8 = 40\n5 x 9 = 45\n5 x 10 = 50' },
      { input: '3\n', output: '3 x 1 = 3\n3 x 2 = 6\n3 x 3 = 9\n3 x 4 = 12\n3 x 5 = 15\n3 x 6 = 18\n3 x 7 = 21\n3 x 8 = 24\n3 x 9 = 27\n3 x 10 = 30' },
    ]),
  },
  {
    title: 'Factorial of a Number',
    description: `Given a non-negative integer \`n\`, return the factorial of \`n\`.

**Example:**
- Input: \`5\`
- Output: \`120\`

**Note:** 0! = 1`,
    difficulty: 'Easy',
    category: 'Loops',
    year: '1st Year',
    functionName: 'Main',
    starterCode: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        if (!scanner.hasNextInt()) return;
        int n = scanner.nextInt();
        
        Solution sol = new Solution();
        System.out.println(sol.factorial(n));
    }
}

class Solution {
    public int factorial(int n) {
        // Write your logic here
        
        return 0;
    }
}
`,
    testCases: JSON.stringify([
      { input: '5\n', output: '120' },
      { input: '0\n', output: '1' },
      { input: '1\n', output: '1' },
      { input: '10\n', output: '3628800' },
    ]),
  },
  {
    title: 'Check Prime',
    description: `Given a positive integer \`n\`, determine if it is a prime number. Return \`true\` if prime, \`false\` otherwise.

**Example:**
- Input: \`7\`
- Output: \`true\`
- Input: \`4\`
- Output: \`false\``,
    difficulty: 'Easy',
    category: 'Loops',
    year: '1st Year',
    functionName: 'Main',
    starterCode: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        if (!scanner.hasNextInt()) return;
        int n = scanner.nextInt();
        
        Solution sol = new Solution();
        System.out.println(sol.isPrime(n));
    }
}

class Solution {
    public boolean isPrime(int n) {
        // Write your logic here
        
        return false;
    }
}
`,
    testCases: JSON.stringify([
      { input: '7\n', output: 'true' },
      { input: '4\n', output: 'false' },
      { input: '2\n', output: 'true' },
      { input: '1\n', output: 'false' },
    ]),
  },
  {
    title: 'Sum of Digits',
    description: `Given a positive integer \`n\`, return the sum of its digits.

**Example:**
- Input: \`1234\`
- Output: \`10\` (1+2+3+4)`,
    difficulty: 'Easy',
    category: 'Loops',
    year: '1st Year',
    functionName: 'Main',
    starterCode: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        if (!scanner.hasNextInt()) return;
        int n = scanner.nextInt();
        
        Solution sol = new Solution();
        System.out.println(sol.sumOfDigits(n));
    }
}

class Solution {
    public int sumOfDigits(int n) {
        // Write your logic here
        
        return 0;
    }
}
`,
    testCases: JSON.stringify([
      { input: '1234\n', output: '10' },
      { input: '9999\n', output: '36' },
      { input: '0\n', output: '0' },
    ]),
  },

  // ── 2nd Year ───────────────────────────────────────────────────────
  {
    title: 'Fibonacci Number',
    description: `Given \`n\`, return the \`n\`-th Fibonacci number.

F(0) = 0, F(1) = 1, F(n) = F(n-1) + F(n-2)

**Example:**
- Input: \`10\`
- Output: \`55\`
`,
    difficulty: 'Medium',
    category: 'Recursion',
    year: '2nd Year',
    functionName: 'Main',
    starterCode: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        if (!scanner.hasNextInt()) return;
        int n = scanner.nextInt();
        
        Solution sol = new Solution();
        System.out.println(sol.fib(n));
    }
}

class Solution {
    public int fib(int n) {
        // Write your logic here
        
        return 0;
    }
}
`,
    testCases: JSON.stringify([
      { input: '0\n', output: '0' },
      { input: '1\n', output: '1' },
      { input: '10\n', output: '55' },
      { input: '15\n', output: '610' },
    ]),
  },
  {
    title: 'Palindrome Check',
    description: `Given a string \`s\`, determine if it is a palindrome, considering only alphanumeric characters and ignoring cases.

**Example:**
- Input: \`A man a plan a canal Panama\`
- Output: \`true\``,
    difficulty: 'Medium',
    category: 'Strings',
    year: '2nd Year',
    functionName: 'Main',
    starterCode: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        if (!scanner.hasNextLine()) return;
        String s = scanner.nextLine();
        
        Solution sol = new Solution();
        System.out.println(sol.isPalindrome(s));
    }
}

class Solution {
    public boolean isPalindrome(String s) {
        // Write your logic here
        
        return false;
    }
}
`,
    testCases: JSON.stringify([
      { input: 'A man a plan a canal Panama\n', output: 'true' },
      { input: 'race a car\n', output: 'false' },
      { input: 'madam\n', output: 'true' },
    ]),
  },
  {
    title: 'Bubble Sort',
    description: `Given an array of integers, sort the array in ascending order using Bubble Sort algorithm.

**Example:**
- Input: \`5\`
  \`64 34 25 12 22\`
- Output: \`12 22 25 34 64\``,
    difficulty: 'Medium',
    category: 'Sorting',
    year: '2nd Year',
    functionName: 'Main',
    starterCode: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        if (!scanner.hasNextInt()) return;
        int n = scanner.nextInt();
        int[] arr = new int[n];
        for (int i = 0; i < n; i++) {
            arr[i] = scanner.nextInt();
        }
        
        Solution sol = new Solution();
        int[] sorted = sol.bubbleSort(arr);
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < sorted.length; i++) {
            if (i > 0) sb.append(" ");
            sb.append(sorted[i]);
        }
        System.out.println(sb.toString());
    }
}

class Solution {
    public int[] bubbleSort(int[] arr) {
        // Write your logic here
        
        return arr;
    }
}
`,
    testCases: JSON.stringify([
      { input: '5\n64 34 25 12 22\n', output: '12 22 25 34 64' },
      { input: '3\n3 1 2\n', output: '1 2 3' },
    ]),
  },
  {
    title: 'Binary Search',
    description: `Given a sorted array of integers and a target value, return the index of the target using Binary Search. Return \`-1\` if not found.

**Example:**
- Input: \`6\`
  \`2 5 8 12 16 23\`
  \`16\`
- Output: \`4\``,
    difficulty: 'Medium',
    category: 'Searching',
    year: '2nd Year',
    functionName: 'Main',
    starterCode: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        if (!scanner.hasNextInt()) return;
        int n = scanner.nextInt();
        int[] arr = new int[n];
        for (int i = 0; i < n; i++) {
            arr[i] = scanner.nextInt();
        }
        int target = scanner.nextInt();
        
        Solution sol = new Solution();
        System.out.println(sol.binarySearch(arr, target));
    }
}

class Solution {
    public int binarySearch(int[] arr, int target) {
        // Write your logic here
        
        return -1;
    }
}
`,
    testCases: JSON.stringify([
      { input: '6\n2 5 8 12 16 23\n16\n', output: '4' },
      { input: '5\n1 3 5 7 9\n4\n', output: '-1' },
      { input: '1\n10\n10\n', output: '0' },
    ]),
  },
  {
    title: 'Find GCD',
    description: `Given two integers \`a\` and \`b\`, return their Greatest Common Divisor (GCD) using the Euclidean algorithm.

**Example:**
- Input: \`12 8\`
- Output: \`4\``,
    difficulty: 'Medium',
    category: 'Math',
    year: '2nd Year',
    functionName: 'Main',
    starterCode: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        if (!scanner.hasNextInt()) return;
        int a = scanner.nextInt();
        int b = scanner.nextInt();
        
        Solution sol = new Solution();
        System.out.println(sol.gcd(a, b));
    }
}

class Solution {
    public int gcd(int a, int b) {
        // Write your logic here
        
        return 0;
    }
}
`,
    testCases: JSON.stringify([
      { input: '12 8\n', output: '4' },
      { input: '15 25\n', output: '5' },
      { input: '7 13\n', output: '1' },
    ]),
  },

  // ── 3rd Year ───────────────────────────────────────────────────────
  {
    title: 'Longest Common Subsequence',
    description: `Given two strings \`text1\` and \`text2\`, return the length of their longest common subsequence.

**Example:**
- Input: \`abcde\` and \`ace\`
- Output: \`3\` (LCS is "ace")`,
    difficulty: 'Hard',
    category: 'Dynamic Programming',
    year: '3rd Year',
    functionName: 'Main',
    starterCode: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        String text1 = scanner.nextLine();
        String text2 = scanner.nextLine();
        
        Solution sol = new Solution();
        System.out.println(sol.longestCommonSubsequence(text1, text2));
    }
}

class Solution {
    public int longestCommonSubsequence(String text1, String text2) {
        // Write your logic here
        
        return 0;
    }
}
`,
    testCases: JSON.stringify([
      { input: 'abcde\nace\n', output: '3' },
      { input: 'abc\nabc\n', output: '3' },
      { input: 'abc\ndef\n', output: '0' },
    ]),
  },
  {
    title: 'Merge Sort',
    description: `Implement Merge Sort to sort an array of integers in ascending order.

**Example:**
- Input: \`5\`
  \`38 27 43 3 9\`
- Output: \`3 9 27 38 43\``,
    difficulty: 'Hard',
    category: 'Sorting',
    year: '3rd Year',
    functionName: 'Main',
    starterCode: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        if (!scanner.hasNextInt()) return;
        int n = scanner.nextInt();
        int[] arr = new int[n];
        for (int i = 0; i < n; i++) {
            arr[i] = scanner.nextInt();
        }
        
        Solution sol = new Solution();
        int[] sorted = sol.mergeSort(arr);
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < sorted.length; i++) {
            if (i > 0) sb.append(" ");
            sb.append(sorted[i]);
        }
        System.out.println(sb.toString());
    }
}

class Solution {
    public int[] mergeSort(int[] arr) {
        // Write your logic here
        
        return arr;
    }
}
`,
    testCases: JSON.stringify([
      { input: '5\n38 27 43 3 9\n', output: '3 9 27 38 43' },
      { input: '3\n5 1 3\n', output: '1 3 5' },
    ]),
  },
  {
    title: 'Graph BFS',
    description: `Given a graph with \`V\` vertices and an adjacency list, perform Breadth-First Search (BFS) starting from vertex 0.

**Example:**
- Input: \`4\` (vertices)
  Edges: \`0-1, 0-2, 1-3\`
- Output: \`0 1 2 3\``,
    difficulty: 'Hard',
    category: 'Graphs',
    year: '3rd Year',
    functionName: 'Main',
    starterCode: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        if (!scanner.hasNextInt()) return;
        int v = scanner.nextInt();
        int e = scanner.nextInt();
        
        ArrayList<ArrayList<Integer>> adj = new ArrayList<>();
        for (int i = 0; i < v; i++) adj.add(new ArrayList<>());
        for (int i = 0; i < e; i++) {
            int a = scanner.nextInt();
            int b = scanner.nextInt();
            adj.get(a).add(b);
            adj.get(b).add(a);
        }
        
        Solution sol = new Solution();
        ArrayList<Integer> result = sol.bfs(v, adj);
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < result.size(); i++) {
            if (i > 0) sb.append(" ");
            sb.append(result.get(i));
        }
        System.out.println(sb.toString());
    }
}

class Solution {
    public ArrayList<Integer> bfs(int v, ArrayList<ArrayList<Integer>> adj) {
        // Write your logic here
        
        return new ArrayList<>();
    }
}
`,
    testCases: JSON.stringify([
      { input: '4 3\n0 1\n0 2\n1 3\n', output: '0 1 2 3' },
      { input: '3 2\n0 1\n1 2\n', output: '0 1 2' },
    ]),
  },
  {
    title: 'Knapsack Problem',
    description: `Given weights and values of \`n\` items, put these items in a knapsack of capacity \`W\` to get the maximum total value.

**Example:**
- Input: \`W = 50\`
  Weights: \`10 20 30\`
  Values: \`60 100 120\`
- Output: \`220\``,
    difficulty: 'Hard',
    category: 'Dynamic Programming',
    year: '3rd Year',
    functionName: 'Main',
    starterCode: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        int n = scanner.nextInt();
        int W = scanner.nextInt();
        int[] weights = new int[n];
        int[] values = new int[n];
        for (int i = 0; i < n; i++) weights[i] = scanner.nextInt();
        for (int i = 0; i < n; i++) values[i] = scanner.nextInt();
        
        Solution sol = new Solution();
        System.out.println(sol.knapsack(W, weights, values, n));
    }
}

class Solution {
    public int knapsack(int W, int[] weights, int[] values, int n) {
        // Write your logic here
        
        return 0;
    }
}
`,
    testCases: JSON.stringify([
      { input: '3 50\n10 20 30\n60 100 120\n', output: '220' },
      { input: '2 3\n10 20\n60 100\n', output: '60' },
    ]),
  },
  {
    title: 'Dijkstra Shortest Path',
    description: `Given a graph with \`V\` vertices and weighted edges, find the shortest distance from source vertex 0 to all other vertices.

**Example:**
- Input: \`3 3\`
  Edges: \`0-1 (4), 0-2 (1), 2-1 (2)\`
- Output: \`0 3 1\``,
    difficulty: 'Hard',
    category: 'Graphs',
    year: '3rd Year',
    functionName: 'Main',
    starterCode: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        int v = scanner.nextInt();
        int e = scanner.nextInt();
        
        ArrayList<ArrayList<int[]>> adj = new ArrayList<>();
        for (int i = 0; i < v; i++) adj.add(new ArrayList<>());
        for (int i = 0; i < e; i++) {
            int a = scanner.nextInt();
            int b = scanner.nextInt();
            int w = scanner.nextInt();
            adj.get(a).add(new int[]{b, w});
            adj.get(b).add(new int[]{a, w});
        }
        
        Solution sol = new Solution();
        int[] dist = sol.dijkstra(v, adj);
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < v; i++) {
            if (i > 0) sb.append(" ");
            sb.append(dist[i]);
        }
        System.out.println(sb.toString());
    }
}

class Solution {
    public int[] dijkstra(int v, ArrayList<ArrayList<int[]>> adj) {
        // Write your logic here
        
        return new int[v];
    }
}
`,
    testCases: JSON.stringify([
      { input: '3 3\n0 1 4\n0 2 1\n2 1 2\n', output: '0 3 1' },
    ]),
  },
];

async function main() {
  console.log('Seeding database...');

  const adminPassword = await bcrypt.hash('sanjai28%$#@', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@codehunt.com' },
    update: {},
    create: {
      email: 'admin@codehunt.com',
      password: adminPassword,
      name: 'Admin',
      role: 'admin',
    },
  });
  console.log('Admin:', admin.email);

  const studentPassword = await bcrypt.hash('student123', 10);

  const students = [
    { email: 'student@codehunt.com', name: 'Demo Student', year: '2nd Year', class: 'B.SC CS' },
    { email: 'ariyan@codehunt.com', name: 'Ariyan', year: '1st Year', class: 'B.SC AIML' },
    { email: 'priya@codehunt.com', name: 'Priya', year: '1st Year', class: 'B.SC BCA' },
    { email: 'karthik@codehunt.com', name: 'Karthik', year: '2nd Year', class: 'B.SC AIML' },
    { email: 'meena@codehunt.com', name: 'Meena', year: '3rd Year', class: 'B.SC CS' },
    { email: 'ravi@codehunt.com', name: 'Ravi', year: '3rd Year', class: 'B.SC BCA' },
  ];

  for (const s of students) {
    const existing = await prisma.user.findUnique({ where: { email: s.email } });
    if (!existing) {
      await prisma.user.create({
        data: {
          email: s.email,
          password: studentPassword,
          name: s.name,
          role: 'student',
          year: s.year,
          class: s.class,
        },
      });
      console.log('Student:', s.email);
    } else {
      console.log('Student exists:', s.email);
    }
  }

  for (const p of problems) {
    const existing = await prisma.problem.findFirst({ where: { title: p.title } });
    if (!existing) {
      await prisma.problem.create({ data: p });
      console.log('Problem:', p.title);
    } else {
      console.log('Problem exists:', p.title);
    }
  }

  const settings = await prisma.siteSettings.upsert({
    where: { id: 'global' },
    update: {},
    create: { id: 'global', webcamEnabled: true },
  });
  console.log('SiteSettings ready');

  console.log('\nSeed complete!');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

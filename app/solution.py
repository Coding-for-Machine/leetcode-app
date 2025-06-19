
def is_palindrome(n: int) -> bool:
    result = 0
    x = n
    while x!=0:
        result = x%10 + result*10
        x//=10
    return result==n

if __name__ == "__main__":
    import sys
    n = int(sys.argv[1])
    expected = sys.argv[2].lower() == "true"
    print(is_palindrome(n) == expected)
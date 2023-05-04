import ast
import multiprocessing
import time
from functools import wraps

func_calls = multiprocessing.Queue()


def timed_function_call(func):
    global func_calls

    @wraps(func)
    def wrapper(*args, **kwargs):
        start_time = time.time()
        result = func(*args, **kwargs)
        elapsed_time = time.time() - start_time
        # func_calls.append((func.__name__, start_time, elapsed_time))
        func_calls.put((func.__name__, start_time, elapsed_time))
        return result

    return wrapper


class FunctionTimingTransformer(ast.NodeTransformer):
    def visit_FunctionDef(self, node):
        # Generate a new function with the same body as the original function
        wrapped_name = f"_wrapped_{node.name}"
        wrapped_body = ast.FunctionDef(
            name=wrapped_name,
            args=node.args,
            body=node.body,
            decorator_list=[],
            returns=node.returns,
        )

        # Create the timing decorator node directly
        timing_decorator = ast.Name(id="timed_function_call", ctx=ast.Load())

        # Wrap the new function with the timing decorator
        wrapped_body.decorator_list = [timing_decorator] + node.decorator_list

        # Replace the original function with the wrapped version
        alias_node = ast.Assign(
            targets=[ast.Name(id=node.name, ctx=ast.Store())],
            value=ast.Name(id=wrapped_name, ctx=ast.Load()),
        )

        return [wrapped_body, alias_node]


def execute_with_timing(source_code):
    # Parse the source code into an AST
    tree = ast.parse(source_code)

    # Apply the AST transformer to wrap all function definitions with timing code
    tree = FunctionTimingTransformer().visit(tree)
    ast.fix_missing_locations(tree)

    # Compile and execute the modified code
    exec(compile(tree, filename="<ast>", mode="exec"), globals())


source_code = """
def foo(x):
    return x * 2

def bar(y):
    return y * 3

print(foo(5))
print(bar(7))
"""

other_source_code = """
import time

def multiply(x, y):
    time.sleep(0.1)  # Wait for 0.1 seconds
    return x * y

def add(x, y):
    return x + y

def subtract(x, y):
    time.sleep(0.05)  # Wait for 0.05 seconds
    return x - y

def divide(x, y):
    return x / y

def calculate(x, y):
    result1 = multiply(x, y)
    result2 = add(result1, x)
    result3 = subtract(result2, y)
    result4 = divide(result3, x)
    return result4

while True:
    result = calculate(2, 3)
    print(result)
    time.sleep(0.2)  # Wait for 0.2 seconds before calculating again
"""

# execute_with_timing(source_code)
# execute_with_timing(other_source_code)
p = multiprocessing.Process(target=execute_with_timing, args=(other_source_code,))
p.start()

while True:
    while not func_calls.empty():
        item = func_calls.get()
        output = f"Function: {item[0]}, Time: {item[1]:.3f}, CPU time: {item[2]:.6f}"
        print(output)
    time.sleep(1)
p.join()

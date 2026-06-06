import sys, importlib, os
print('cwd=', os.getcwd())
print('\nfirst sys.path entries:')
for i,p in enumerate(sys.path[:10]): print(i, p)
print('\nexists api at project root:', os.path.isdir(os.path.join(os.getcwd(),'api')))
print('exists backend/api:', os.path.isdir(os.path.join(os.getcwd(),'backend','api')))
try:
    m = importlib.import_module('api.app')
    print('\nimported api.app ->', m)
except Exception as e:
    print('\nimport error ->', repr(e))

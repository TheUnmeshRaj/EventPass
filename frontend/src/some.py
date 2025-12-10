import base64
import zlib

# 1. The raw trace captured by Franky
trace_hex = "476222424b303f4d3b5a3933334f603d2224673c3c51495d5f39253f694758743231736275482f45385049387565552c666d724d5a43704c3a55674b4440482556252e5333442f7542655a69674222583a624258723c743e63674031244a4f28586b4f372a712d705226586a6773673b735e2d626a60596125623e53446b594135495f3c4d58316e57286434345132354c495e2b563c564b727158213c405a2a624f59"

try:
    ascii85_payload = bytes.fromhex(trace_hex)
    compressed_data = base64.a85decode(ascii85_payload)
    flag = zlib.decompress(compressed_data)
    print(f"The message is: {flag.decode('utf-8')}")

except Exception as e:
    print(f"Decryption failed: {e}")
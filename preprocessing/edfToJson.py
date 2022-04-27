from pyedflib import highlevel
import json
import sys

fileName = sys.argv[1]
subjectName = input("Enter Subject ID: ")

def electrodeHeader(l):
    return l.startswith('G')

print("Getting Header...")
header = highlevel.read_edf_header(fileName)
print("Done")

print("Getting Labels...")
labels = list(filter(electrodeHeader, header['channels']))
print("Done")

print("Getting Signals...")
signals, signal_headers, header = highlevel.read_edf(fileName, ch_names = labels)
print("Done")

#with open('header.json', 'w') as fp:
#    json.dump(header, fp)

print("Generating JSON...")
with open('signal_header.json', 'w') as fp:
    json.dump(signal_headers, fp)
print("Done")

step = 10

print("Generating Signal File...")
filename = f'{subjectName}.signal'
with open(filename, mode='wb') as f:
    for signal in signals:
        newFileByteArray = bytes(signal[::step])
        f.write(newFileByteArray)
print("Done")

# for i, sig in enumerate(signals):
#     filename = f'signal_{labels[i]}.signal'
#     with open(filename, mode='wb') as f:
#         newFileByteArray = bytes(sig[::step])
#         f.write(newFileByteArray)

# for i, sig in enumerate(signals):
#     with open('signal_'+labels[i]+'.txt', 'w') as f:
#         print(*sig, sep=',', file=f)

#with open('signals.json', 'w') as fp:
#    json.dump(signals, fp)
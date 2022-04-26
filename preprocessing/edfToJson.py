from pyedflib import highlevel
import json
import sys

fileName = sys.argv[1]

def electrodeHeader(l):
    return l.startswith('G')

header = highlevel.read_edf_header(fileName)

labels = list(filter(electrodeHeader, header['channels']))

signals, signal_headers, header = highlevel.read_edf(fileName, ch_names = labels)

#with open('header.json', 'w') as fp:
#    json.dump(header, fp)

with open('signal_header.json', 'w') as fp:
    json.dump(signal_headers, fp)

for i, sig in enumerate(signals):
    filename = f'signal_{labels[i]}.signal'
    with open(filename, mode='wb') as f:
        newFileByteArray = bytes(sig)
        f.write(newFileByteArray)

# for i, sig in enumerate(signals):
#     with open('signal_'+labels[i]+'.txt', 'w') as f:
#         print(*sig, sep=',', file=f)

#with open('signals.json', 'w') as fp:
#    json.dump(signals, fp)
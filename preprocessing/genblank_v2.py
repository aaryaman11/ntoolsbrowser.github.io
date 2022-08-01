import json
import sys

def get_connection(index):
    connect_index = int(index) - 1
    connect = {
        "index": connect_index,
        "elecID": electrode_objects[connect_index]["elecID"],
    }
    return connect

def get_coords(x, y, z):
    coords = {
        "x": float(x),
        "y": float(y),
        "z": float(z),
    }
    return coords

def isComposite(type):
  return len(type.split(',')) > 1

if  len(sys.argv) == 2:
    subject = input("Enter Subject ID: ")
    coord_file = open(sys.argv[1])
    coord_contents = coord_file.read()
    electrode_objects = []

    default_seizures = ["Seizure Type 1", "intPopulation", "funMapping"]
    total_seizure_types = 1

    for line in coord_contents.split('\n'):
        try:
            coordinate_tuple = tuple(line.rstrip().split(' '))
            (ID, x, y, z, elecType) = coordinate_tuple
            electrode_data = {
            "elecID": ID,
            "coordinates": get_coords(x, y, z),
            "elecType": elecType,
            "Seizure Type 1": "",
            "intPopulation": 0,
            }
            electrode_objects.append(electrode_data)
        except ValueError:
            continue
    
    final_json = {
    "subjID": subject,
    "totalSeizType": total_seizure_types,
    "SeizDisplay": default_seizures,
    "electrodes": electrode_objects,
    "functionalMaps": [],
    }

    with open(f'sub-{subject}_ntoolsbrowser.json', 'w') as output_file:
        json.dump(final_json, output_file, ensure_ascii=False, indent=4)

else:
    print("Invalid inputs")
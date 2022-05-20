import numpy as np
import pandas as pd
import pprint
import json

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

subject = 'NY841'

attributes_df = pd.read_excel(f'{subject}/{subject}_attributes.xlsx')
functions_df = pd.read_excel(f'{subject}/{subject}_functions.xlsx')
coord_file = open('NY841/NY841_841_T1T2_coor_T1_2021-07-30.txt', 'r')
coord_contents = coord_file.read()

seizure_types = [col for col in attributes_df.columns if col.lower().startswith('seizure')]
electrode_objects = []

for line in coord_contents.split('\n'):
  try:
    coordinate_tuple = tuple(line.rstrip().split(' '))
    (ID, x, y, z, elecType) = coordinate_tuple
    electrode_data = {
      "elecID": ID,
      "coordinates": get_coords(x, y, z),
      "elecType": elecType,
    }
    electrode_objects.append(electrode_data)
  except ValueError:
    continue


for index, row in attributes_df.iterrows():
  if pd.isnull(row['Interictal Population']):
    electrode_objects[index]['intPopulation'] = [0]
  else:
    # print("why")
    int_population = str(int(row['Interictal Population']))
    electrode_objects[index]['intPopulation'] = list(map(lambda x: int(x), int_population.split(',')))

  for type in seizure_types:
    if pd.isnull(row[type]):
      electrode_objects[index][type] = ""
    else:
      electrode_objects[index][type] = str(row[type]).split(', ')

functional_maps = []
for index, row in functions_df.iterrows():
  fmap_dict = {}
  for fmap in row.keys():
    if pd.isnull(row[fmap]):
      fmap_dict[f'fmap{fmap}'] = ''
    else:
      if fmap == "G1" or fmap == "G2":
        connect_index = int(row[fmap] - 1)
        connected_object = electrode_objects[connect_index]['elecID']
        fmap_dict[f'fmap{fmap}'] = {
          "index": connect_index,
          "elecID": connected_object
        }
      elif fmap == "After Discharges":
        fmap_dict["fmapAfterDischarge"] = row[fmap]
      else: 
        fmap_dict[f'fmap{fmap}'] = row[fmap]
  functional_maps.append(fmap_dict)

final_json = {
  "subjID": subject,
  "totalSeizType": len(seizure_types),
  "SeizDisplay": seizure_types + ["intPopulation", "funMapping"],
  "electrodes": electrode_objects,
  "functionalMaps": functional_maps,
}

with open(f'sub-{subject}_ntoolsbrowser.json', 'w') as output_file:
  json.dump(final_json, output_file, ensure_ascii=False, indent=4)
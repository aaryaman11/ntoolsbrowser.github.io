import sys
import json
import openpyxl
from pathlib import Path

# path to txt
coord_file = open(sys.argv[1], 'r')

# path to xlsx
attributes = Path(sys.argv[2])
subject_name = input("Enter Subject ID: ")

wb_obj = openpyxl.load_workbook(attributes)
sheet = wb_obj.active
all_rows = sheet.iter_rows(values_only=True)
# remove title attrs
next(all_rows)

content = coord_file.read()
coor_dicts = []
final_json = { "subjID" : subject_name }

for line in content.split('\n'):
    data_tuple = tuple(line.rstrip().split(' '))
    electrode_data = {}
    try:
        (ID, x, y, z, electype) = data_tuple
        (ID2, intPop, seiz1, seiz2) = next(all_rows)
        electrode_data["elecID"] = ID
        electrode_data["coorX"] = x
        electrode_data["coorY"] = y
        electrode_data["coorZ"] = z
        electrode_data["elecType"] = electype
        electrode_data["intPopulation"] = intPop if intPop else 0
        
        # need to figure out a way to do this for when there are more than 2
        # seiztypes...
        electrode_data["seizType1"] = seiz1 if seiz1 else ''
        electrode_data["seizType2"] = seiz2 if seiz2 else ''
        coor_dicts.append(electrode_data)
        
    except ValueError:
        # happens when an extra newline is at the end of the file
        continue
        
final_json["electrodes"] = coor_dicts

with open(f'{subject_name}.json', 'w') as output_file:
    json.dump(final_json, output_file, ensure_ascii=False, indent=4)
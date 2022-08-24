import json
import sys
import glob
import os

ldir="/Volumes/Epilepsy_ECOG/ecog/loc"
wdir="/Volumes/Epilepsy_ECOG/ecog/web"
fdir="/Volumes/Epilepsy_ECoG/bigpurple_autorecon/fs"

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
    subject = sys.argv[1]

    # create BIDS folder
    os.makedirs(wdir + "/sub-" + subject)
    os.makedirs(wdir + "/sub-" + subject + "/ana")
    os.makedirs(wdir + "/sub-" + subject + "/ieeg")
    
    # extract brain surface and volume files
    ffolders = glob.glob(fdir + "/auto" + subject + "*")
    if len(ffolders) == 0:
        print("Freesurfer folder not found")
        sys.exit()
    ffolders.sort(key=os.path.getmtime)
    os.system("cp " + ffolders[0] + "/surf/lh.pial " + wdir + "/sub-" + subject + "/ana/sub-" + subject + "_freesurferleft.pial")
    os.system("cp " + ffolders[0] + "/surf/rh.pial " + wdir + "/sub-" + subject + "/ana/sub-" + subject + "_freesurferright.pial")
    os.system("gunzip -c " + ldir + "/" + subject + "/T1.nii.gz > " + wdir + "/sub-" + subject + "/ana/sub-" + subject + "_preoperation_T1w.nii")

    # generate json file
    cfiles = glob.glob(ldir + "/" + subject + "/*_coor_T1_*.txt")
    if len(cfiles) == 0:
        print("Elec coordinate text file not found")
        sys.exit()
    cfiles.sort(key=os.path.getmtime)
    coord_file = open(cfiles[0])
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

    jfile=wdir + "/sub-" + subject + "/ieeg/sub-" + subject + "_ntoolsbrowser.json"
    with open(jfile, 'w') as output_file:
        json.dump(final_json, output_file, ensure_ascii=False, indent=4)
else:
    print("Invalid inputs")

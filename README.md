
![https://tilak.io/](docs/tilak.svg)

# About Tilak.io

We are an engineering services company that focus on drone technologies. 
We decided to opensource TiPlot, our log visualising tool, so the world can benefit from a nice and easy way to display logs from **PX4**, **CSV**, or even from your **Python** code or your **Jupyter Notebook**.

# Feature Request

Please reach out to us via our website [Tilak.io](https://tilak.io/), we are happy to help !

# About TiPlot

TiPlot is an open-source visualisation tool for flight logs. With TiPlot, you can easily visualize your flight data in 2D graphs and a 3D view, helping you better understand the performance and behavior of your unmanned aerial vehicle (UAV).

![Entities](docs/demo.png)

## Features

- Supports multiple file formats, including : 
  - PX4's .ulg
  - Generic .csv
  - DJI's .DAT
  - QGroundControl's .tlog
  - Ardupilot's .BIN Logs.
- 2D yt and xy graphs for visualizing flight data.
- 3D viewer for displaying the paths of your UAVs.
- Add multiple UAVs to compare flights.
- Sync the 3D view with a specific timestamp by hovering over it.
- Perform customized operations on data currently being processed.
- Ability to send a data dictionary and entities to be displayed in the 3D view over TCP port `5555` from a Python script or a Jupyter notebook.
- Layouts are automatically saved after every change.
- Drag and drop plots to reposition them.
- Plot multiple fields from different topics in yt graphs.
- X scale of all graphs is synced when zooming in.
- Y scale of graphs is automatically set to fit all available data in the timestamp range.
- Change view layout from split to detached to detach the 3D view as a new window.
- Adjust camera settings and change background color and show grids on the 3 axis in the settings page.

## Installation

### Prebuilt AppImage

To run TiPlot using the prebuilt AppImage, follow these steps:

1. Download the latest AppImage from the [releases page](https://github.com/tilak-io/tiplot/releases/latest).
2. Make the AppImage executable by running:
```bash 
cd ~/Downloads
chmod +x tiplot-1.x.x.AppImage
```
3. Run the AppImage:
```bash 
./tiplot-1.x.x.AppImage
```

### Building from source

To build TiPlot from source, follow these steps:

1. Clone the repository:
```
git clone https://github.com/tilak-io/tiplot
cd tiplot
```
2. Install dependencies:
```
# Install Node dependencies 
yarn install
# Install Python dependencies:
pip3 install -r api/requirements.txt
```
3. Start the API server:

```
yarn start:api
```
In a new terminal, start the front end: 
```
yarn start
```

## Usage
To use TiPlot, follow these steps:

1. Launch TiPlot's AppImage, exe or compiled build.
2. Click the "Browse" button to select a flight log file.
3. Add a graph (yt or xy).
4. Use the ALT + hover feature to sync the 3D view with a specific timestamp.
5. Use the entities page to choose the UAV's position/attitude tables.

##  Sending data from a Python script or Jupyter notebook
To send data to TiPlot from a Python script or Jupyter notebook, you can use the following code:
```python
import zmq
import zlib
import pickle
import pyulog
import pandas as pd

port = '5555'
context = zmq.Context()
socket = context.socket(zmq.REQ)
socket.connect("tcp://0.0.0.0:%s" % port)

def send_zipped_pickle(socket, obj, flags=0, protocol=-1):
    p = pickle.dumps(obj, protocol)
    z = zlib.compress(p)
    return socket.send(z, flags=flags)

send_zipped_pickle(socket, [datadict, []])
```

Note that `datadict` is the data dictionary returned by the parser.
`[]` is the entities array (empty array means we don't want to display anything on 3d view)

For more info check out the Jupyter notebooks in the [templates](https://github.com/tilak-io/tiplot/blob/main/templates) folder.

## Running Sequences and Custom Operations

In this guide, we will walk you through the process of creating and executing sequences, which are Python functions containing a set of operations to manipulate log data. These sequences can be customized to suit your specific needs. Follow these steps to get started:

1. **Set Preferred Editor**: Ensure that you have configured your preferred code editor in the tool settings by navigating to `Tools > Settings > General > External Editor`. If you intend to use a terminal-based editor such as Vim or Nano, make sure to specify the appropriate command to launch the terminal. (i.e: `kitty nvim` for kitty, `gnome-terminal -- nvim` for ubuntu's default terminal, `xterm -e nvim` for xterm...)

2. **Create a New Sequence**: To begin, create a new sequence by navigating to `Tools > Sequences > Add New Sequence`.

3. **Provide a Descriptive Name**: Give your sequence a meaningful and descriptive name that reflects its purpose.

4. **Edit the Sequence**: Upon creating a new sequence, your preferred code editor will open with a template function. You can now define the operations you want to perform on the log data.

Here's an example of a sequence that transforms log data from the NED (North-East-Down) representation to the ENU (East-North-Up) representation for a topic called `vehicle_local_position_enu`:

```python
def handle_data(datadict):
    import numpy as np
    new = datadict
    # Coordinate transformation matrix from NED to ENU
    NED_to_ENU = np.array([
        [0, 1, 0],  # East (ENU X) corresponds to North (NED Y)
        [1, 0, 0],  # North (ENU Y) corresponds to East (NED X)
        [0, 0, -1]  # Up (ENU Z) corresponds to -Down (NED Z)
    ])
    # Apply the coordinate transformation to the 'x', 'y', and 'z' columns
    new['vehicle_local_position_enu'] = new['vehicle_local_position'].copy()
    xyz_ned = new['vehicle_local_position_enu'][['x', 'y', 'z']].values
    xyz_enu = np.dot(xyz_ned, NED_to_ENU.T)  # Transpose the transformation matrix for NED to ENU
    new['vehicle_local_position_enu'][['x', 'y', 'z']] = xyz_enu
    return new
```

***NOTE: the imports should be inside the function***

Feel free to adapt and customize your sequence function to perform the operations that are relevant to your data processing needs.

Happy sequencing 🎉!

## Contributing
We welcome contributions to TiPlot. If you would like to contribute, please follow these steps:

1. Fork the repository.
2. Create a new branch for your changes.
3. Make your changes and commit them to your branch.
4. Push your branch to your forked repository.
5. Create a new pull request.

## License
This project is licensed under the Apache License, Version 2.0. See the [LICENSE](https://github.com/tilak-io/tiplot/blob/main/LICENSE.md) file for details.

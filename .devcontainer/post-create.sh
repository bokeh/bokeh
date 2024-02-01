# Change to the directory containing the conda env .yml files
cd conda

# Find all .yml files, extract Python version numbers, sort, and get the highest version
highest_version_file=$(ls *-*.yml | sort -V | tail -1)

# Check if a file was found
if [ -z "$highest_version_file" ]; then
    echo "No conda environment.yml file found"
    exit 1
fi

# Create the conda environment using the file with the highest Python version
conda env create -n bkdev -f "$highest_version_file"
cd ..

# Activate the bkdev conda environment whenever a new shell is opened
conda init bash && . /root/.bashrc && conda activate bkdev
echo 'conda activate bkdev' >> /root/.bashrc

# Install bokeh and bokehjs
cd bokehjs && npm install --location=global npm && npm ci && cd ..
pip install -e .
bokeh sampledata

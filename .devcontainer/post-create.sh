# Create conda env from file
conda env create -n bkdev -f conda/environment-test-3.12.yml

# Activate the bkdev conda environment whenever a new shell is opened
conda init bash && . /root/.bashrc && conda activate bkdev
echo 'conda activate bkdev' >> /root/.bashrc

# Install bokeh and bokehjs
cd bokehjs && npm install --location=global npm && npm ci && cd ..
pip install -e .
bokeh sampledata

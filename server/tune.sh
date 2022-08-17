sudo ulimit -n 65535
sudo sysctl -w fs.file-max=2097152
sudo sysctl -w net.core.somaxconn=65535
sudo sysctl -w net.core.rmem_max=25165824
sudo sysctl -w net.core.wmem_max=25165824
document.addEventListener('DOMContentLoaded', function() {
    const tcpPortsInput = document.getElementById('tcpPortsInput');
    const udpPortsInput = document.getElementById('udpPortsInput');
    const tcpPortsContainer = document.getElementById('tcpPortsContainer');
    const udpPortsContainer = document.getElementById('udpPortsContainer');

    tcpPortsInput.addEventListener('input', function(event) {
        handleInput(event, tcpPortsInput, udpPortsInput);
    });

    udpPortsInput.addEventListener('input', function(event) {
        handleInput(event, udpPortsInput, tcpPortsInput);
    });

    function handleInput(event, currentInput, otherInput) {
        const trimmedValue = currentInput.value.trim();
        if (event.inputType === 'insertText' && event.data === '' && trimmedValue) {
            const valueWithComma = trimmedValue.endsWith(' ') ? trimmedValue : trimmedValue + ',';
            currentInput.value = valueWithComma;
            currentInput.setSelectionRange(valueWithComma.length, valueWithComma.length);
        }
        if (event.inputType === 'insertText' && event.data === ' ' && trimmedValue) {
            const valueWithComma = trimmedValue.endsWith(' ') ? trimmedValue : trimmedValue + ',';
            currentInput.value = valueWithComma;
            currentInput.setSelectionRange(valueWithComma.length, valueWithComma.length);
        }
        if (event.inputType === 'insertText' && event.data === '\n' && trimmedValue) {
            const otherTrimmedValue = otherInput.value.trim();
            if (!otherTrimmedValue) {
                otherInput.focus();
            }
        }
        updatePorts();
    }

    function updatePorts() {
        const tcpPorts = tcpPortsInput.value.replace(/\s+/g, ',').split(',');
        const udpPorts = udpPortsInput.value.replace(/\s+/g, ',').split(',');
        tcpPortsContainer.innerHTML = '';
        udpPortsContainer.innerHTML = '';

        tcpPorts.forEach(port => {
            const trimmedPort = port.trim();
            if (trimmedPort) {
                const portTag = document.createElement('span');
                portTag.className = 'port-tag tcp';
                portTag.textContent = trimmedPort;
                tcpPortsContainer.appendChild(portTag);
            }
        });

        udpPorts.forEach(port => {
            const trimmedPort = port.trim();
            if (trimmedPort) {
                const portTag = document.createElement('span');
                portTag.className = 'port-tag udp';
                portTag.textContent = trimmedPort;
                udpPortsContainer.appendChild(portTag);
            }
        });
    }

    const customIptablesForm = document.getElementById('customIptablesForm');
    customIptablesForm.addEventListener('submit', function(event) {
        event.preventDefault();

        let bypassIp = document.getElementById('bypassIp').value;
        let alwaysAcceptIp = document.getElementById('alwaysAcceptIp').value;
        let tcpPorts = tcpPortsInput.value.split(',');
        let udpPorts = udpPortsInput.value.split(',');
        let rateLimit = document.getElementById('rateLimit').value;
        let dropInvalid = document.getElementById('dropInvalid').checked;
        let dropBadConn = document.getElementById('dropBadConn').checked;
        let denyFragments = document.getElementById('denyFragments').checked;
        let globalConnectionLimit = document.getElementById('globalConnectionLimit').value;

        let command = '';
        if (dropInvalid) {
            command += 'iptables -A INPUT -m state --state INVALID -j DROP\n';
        }
        if (dropBadConn) {
            command += 'iptables -A INPUT -p tcp --tcp-flags ALL NONE -j DROP\n';
        }
        if (denyFragments) {
            command += 'iptables -A INPUT -f -j DROP\n';
        }

        command += `iptables -A INPUT -s ${bypassIp} -j ACCEPT\n`;
        if (alwaysAcceptIp) {
            command += `iptables -A INPUT -s ${alwaysAcceptIp} -j ACCEPT\n`;
        }

        tcpPorts.forEach(port => {
            let trimmedPort = port.trim();
            if (rateLimit) {
                command += `iptables -A INPUT -p tcp --dport ${trimmedPort} -m limit --limit ${rateLimit} -j ACCEPT\n`;
            } else {
                command += `iptables -A INPUT -p tcp --dport ${trimmedPort} -j ACCEPT\n`;
            }
        });

        udpPorts.forEach(port => {
            let trimmedPort = port.trim();
            if (rateLimit) {
                command += `iptables -A INPUT -p udp --dport ${trimmedPort} -m limit --limit ${rateLimit} -j ACCEPT\n`;
            } else {
                command += `iptables -A INPUT -p udp --dport ${trimmedPort} -j ACCEPT\n`;
            }
        });

        if (globalConnectionLimit) {
            command += `iptables -A INPUT -m conntrack --ctstate NEW -m limit --limit ${globalConnectionLimit} -j ACCEPT\n`;
        }

        document.getElementById('commandOutput').textContent = command;
    });
});

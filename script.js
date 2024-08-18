document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('gear-form');
  const gearTable = document.getElementById('gear-table').getElementsByTagName('tbody')[0];
  const resultTable = document.getElementById('result-table').getElementsByTagName('tbody')[0];
  const perkOptions = [
    'Galestorm', 'Devourer', 'Early Reaper', 'Endurance', 'Survival Instinct', 'Crush Them', 'Head Hunter',
    'Aegis', 'Shields Up', 'Bastion', 'Vengeful Barrier', 'Last Stand', 'Fresh Focus', 'Bulk Up',
    'Radiant Rebound', 'Remedy', 'Feline Agility', 'Supersonic', 'Clever Tactics', 'Rising Dawn', 'Rapid Refresh'
  ];

  // Load existing gear data
  fetch('gear_data.json')
    .then(response => response.json())
    .then(data => {
      window.gearData = data; // Store gear data globally
      updateTable(data);
      filterCombinations(); // Initialize table with empty results
    })
    .catch(error => console.error('Error loading gear data:', error));

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const gearData = {
      action: 'add',
      type: formData.get('type'),
      name: formData.get('name'),
      perks: {}
    };
    if (formData.get('perk1')) {
      gearData.perks[formData.get('perk1')] = parseInt(formData.get('perk1-value'));
    }
    if (formData.get('perk2')) {
      gearData.perks[formData.get('perk2')] = parseInt(formData.get('perk2-value'));
    }

    // Update JSON file and table
    fetch('update_gear.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(gearData)
    })
    .then(response => response.json())
    .then(updatedData => {
      window.gearData = updatedData; // Update global gear data
      updateTable(updatedData);
      filterCombinations(); // Recalculate and display combinations
    })
    .catch(error => console.error('Error updating gear data:', error));
  });

  function updateTable(data) {
    gearTable.innerHTML = '';
    Object.keys(data).forEach(type => {
      data[type].forEach(gear => {
        const row = gearTable.insertRow();
        row.insertCell().textContent = capitalizeFirstLetter(type);
        row.insertCell().textContent = gear.name;
        row.insertCell().textContent = Object.keys(gear.perks)[0] || '-';
        row.insertCell().textContent = Object.values(gear.perks)[0] || '-';
        row.insertCell().textContent = Object.keys(gear.perks)[1] || '-';
        row.insertCell().textContent = Object.values(gear.perks)[1] || '-';
        const removeCell = row.insertCell();
        const removeButton = document.createElement('button');
        removeButton.textContent = 'Remove';
        removeButton.className = 'btn btn-danger btn-sm';
        removeButton.addEventListener('click', () => removeGear(type, gear.name));
        removeCell.appendChild(removeButton);
      });
    });
  }

  function removeGear(type, name) {
    fetch('update_gear.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'remove',
        type: type,
        name: name
      })
    })
    .then(response => response.json())
    .then(updatedData => {
      window.gearData = updatedData; // Update global gear data
      updateTable(updatedData);
      filterCombinations(); // Recalculate and display combinations
    })
    .catch(error => console.error('Error removing gear:', error));
  }

  function updateResultTable(combinations) {
    resultTable.innerHTML = '';
    combinations.forEach(combo => {
      const row = resultTable.insertRow();
      
      // Create combination details with gear types
      const comboCell = row.insertCell();
      const comboDetails = combo.combination.map((gear, index) => {
        const type = ['helm', 'chest', 'arms', 'weapon1', 'weapon2', 'weapon3'][index];
        return `${capitalizeFirstLetter(type)}: ${gear.name}`;
      }).join(' | ');
        
      comboCell.textContent = comboDetails;
      
      // Create active perks cell
      const perksCell = row.insertCell();
      perksCell.textContent = combo.activePerks.join(', ');
    });
  }

  // Helper function to capitalize the first letter
  function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  function calculateBestCombinations(data) {
    // Store gear data globally for filtering
    window.gearData = data;

    const gearTypes = ['helm', 'chest', 'arms', 'weapon1', 'weapon2', 'weapon3'];
    const allGearCombinations = getAllCombinations(data, gearTypes);
    
    const perkCombinations = [];
    
    allGearCombinations.forEach(combination => {
      const perkTotals = {};
      
      combination.forEach(gear => {
        Object.keys(gear.perks).forEach(perk => {
          if (!perkTotals[perk]) {
            perkTotals[perk] = 0;
          }
          perkTotals[perk] += gear.perks[perk];
        });
      });
      
      const activePerks = Object.keys(perkTotals).filter(perk => perkTotals[perk] >= 600);
      
      if (activePerks.length > 0) {
        perkCombinations.push({
          combination,
          activePerks
        });
      }
    });
    
    return perkCombinations;
  }

  function getAllCombinations(data, types) {
    const combinations = [];
    
    function generateCombinations(index, current) {
      if (index === types.length) {
        combinations.push(current);
        return;
      }
      
      const type = types[index];
      data[type].forEach(gear => {
        generateCombinations(index + 1, [...current, gear]);
      });
    }
    
    generateCombinations(0, []);
    return combinations;
  }

  function populatePerkOptions() {
    const perk1Select = document.getElementById('perk1');
    const perk2Select = document.getElementById('perk2');
    const perkFilters = document.getElementById('perk-filters');
    
    perkOptions.forEach((perk, index) => {
      // Populate perk dropdowns
      const option1 = document.createElement('option');
      option1.value = perk;
      option1.textContent = perk;
      perk1Select.appendChild(option1.cloneNode(true));
      
      const option2 = document.createElement('option');
      option2.value = perk;
      option2.textContent = perk;
      perk2Select.appendChild(option2.cloneNode(true));

      // Create checkboxes for filtering
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.value = perk;
      checkbox.id = `perk-filter-${index}`;
      checkbox.className = 'form-check-input';
      checkbox.addEventListener('change', filterCombinations);

      const label = document.createElement('label');
      label.textContent = perk;
      label.htmlFor = checkbox.id;
      label.className = 'form-check-label';
      
      const div = document.createElement('div');
      div.className = 'form-check';
      div.appendChild(checkbox);
      div.appendChild(label);
      perkFilters.appendChild(div);
    });

    // Add "All" filter
    const allCheckbox = document.createElement('input');
    allCheckbox.type = 'checkbox';
    allCheckbox.id = 'all-filter';
    allCheckbox.className = 'form-check-input';
    allCheckbox.addEventListener('change', filterCombinations);

    const allLabel = document.createElement('label');
    allLabel.htmlFor = 'all-filter';
    allLabel.textContent = 'Show All';
    allLabel.className = 'form-check-label';

    const allDiv = document.createElement('div');
    allDiv.className = 'form-check';
    allDiv.appendChild(allCheckbox);
    allDiv.appendChild(allLabel);
    perkFilters.appendChild(allDiv);
  }

  function filterCombinations() {
    const selectedPerks = Array.from(document.querySelectorAll('.form-check-input:not(#all-filter):checked')).map(cb => cb.value);
    const showAll = document.getElementById('all-filter').checked;

    if (showAll) {
      // Show all combinations when "All" filter is selected
      updateResultTable(calculateBestCombinations(window.gearData));
      return;
    }

    // If no perks are selected, show no combinations
    if (selectedPerks.length === 0) {
      updateResultTable([]);
      return;
    }
    
    const filteredCombinations = calculateBestCombinations(window.gearData).filter(combo =>
      selectedPerks.every(perk => combo.activePerks.includes(perk))
    );
    
    updateResultTable(filteredCombinations);
  }

  // Populate perk options on page load
  populatePerkOptions();
  filterCombinations();
});



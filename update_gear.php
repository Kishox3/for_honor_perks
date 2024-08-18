<?php
header('Content-Type: application/json');

// Path to the JSON file
$jsonFile = 'gear_data_' . $_POST['hero'] . '.json'; // Adjust path to hero-specific JSON file

// Read existing data
$data = json_decode(file_get_contents($jsonFile), true);

// Get action and data from POST request
$request = json_decode(file_get_contents('php://input'), true);
$action = $request['action'];
$type = $request['type'];
$name = $request['name'];

if ($action === 'add') {
    // Check gear limit
    $currentCount = count($data[$type] ?? []);
    if ($currentCount >= 60) {
        http_response_code(400);
        echo json_encode(['error' => 'Gear limit reached']);
        exit;
    }
    
    // Add gear
    $gear = array(
        'name' => $request['name'],
        'perks' => $request['perks']
    );

    if (!isset($data[$type])) {
        $data[$type] = array();
    }
    array_push($data[$type], $gear);
} elseif ($action === 'remove') {
    // Remove gear
    if (isset($data[$type])) {
        $data[$type] = array_filter($data[$type], function($gear) use ($name) {
            return $gear['name'] !== $name;
        });

        // Reindex array to fix keys
        $data[$type] = array_values($data[$type]);
    }
}

// Write updated data back to JSON file
file_put_contents($jsonFile, json_encode($data, JSON_PRETTY_PRINT));

// Return updated data as response
echo json_encode($data);
?>

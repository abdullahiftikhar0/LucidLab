$tempDir = Join-Path $env:TEMP "LucidLabScreens"
$files = Get-ChildItem -Path $tempDir -Filter *.html

foreach ($file in $files) {
    echo "Standardizing interactivity for $($file.Name)..."
    $content = Get-Content -Path $file.FullName -Raw

    # 1. Dashboard: Classroom Cards
    if ($file.Name -eq "dashboard.html") {
        $content = $content -replace 'Classroom Card 1 -->\s*<div class="glass', 'Classroom Card 1 --> <div onclick="sendToUnity(''classroom:advanced_chem'')" class="glass'
        $content = $content -replace 'Classroom Card 2 -->\s*<div class="glass', 'Classroom Card 2 --> <div onclick="sendToUnity(''classroom:quantum_physics'')" class="glass'
        $content = $content -replace 'Floating Action Button -->\s*<button', 'Floating Action Button --> <button onclick="sendToUnity(''join_class_clicked'')"'
    }

    # 2. Universal Bottom Navigation (Home, Experiments, Profile)
    $content = $content -replace '<a (.*)>.*home</span>.*Home</p>\s*</a>', '<a $1 onclick="sendToUnity(''nav:dashboard'')"><div class="text-primary flex h-8 items-center justify-center relative"><span class="material-symbols-outlined fill-1">home</span><p class="text-primary text-[10px] font-bold uppercase tracking-wider">Home</p></a>'
    
    # 3. Join Class Popup: Close and Join buttons
    if ($file.Name -eq "join_class.html") {
        $content = $content -replace 'Cancel</button>', 'Cancel</button>' # Placeholder for consistency
    }

    # 4. Profile: Logout button
    if ($file.Name -eq "profile.html") {
        $content = $content -replace 'Logout</button>', 'Logout</button>' # Placeholder
    }

    Set-Content -Path $file.FullName -Value $content
}

echo "Interactivity standardization complete."

$tempDir = Join-Path $env:TEMP "LucidLabScreens"
if (-not (Test-Path $tempDir)) {
    New-Item -ItemType Directory -Path $tempDir -Force
}

$screens = @{
    "active_assignments"    = "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzQ1MTVlOGQ3OGEzNjQ3YzliOWRkYjVjZGNmNjdkY2Y4EgsSBxDH-KDuygEYAZIBJAoKcHJvamVjdF9pZBIWQhQxNDg5Mzg0NDczMjM4NTA3MzA4MA&filename=&opi=89354086"
    "classroom_detail"      = "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzgxZjBhM2RiYzYyNDQxYWU4NWY0ZDUzZDA0NGVmYjY2EgsSBxDH-KDuygEYAZIBJAoKcHJvamVjdF9pZBIWQhQxNDg5Mzg0NDczMjM4NTA3MzA4MA&filename=&opi=89354086"
    "completed_assignments" = "https://contribution.usercontent.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sX2Y0NWU2YWRmNTA5YzRiMmE5YTQ4YzE3YjM5NDM4MDU3EgsSBxDH-KDuygEYAZIBJAoKcHJvamVjdF9pZBIWQhQxNDg5Mzg0NDczMjM4NTA3MzA4MA&filename=&opi=89354086"
    "profile"               = "https://contribution.usercontent.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzc5ODc5MmI5M2M0YTQwODE5MTNiZDVjMzU3NzFiYTRlEgsSBxDH-KDuygEYAZIBJAoKcHJvamVjdF9pZBIWQhQxNDg5Mzg0NDczMjM4NTA3MzA4MA&filename=&opi=89354086"
    "ar_hud"                = "https://contribution.usercontent.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzgyY2M1NTc2M2M3ODQ1OGE4MjU4ZDQzM2VkY2JmYzk3EgsSBxDH-KDuygEYAZIBJAoKcHJvamVjdF9pZBIWQhQxNDg5Mzg0NDczMjM4NTA3MzA4MA&filename=&opi=89354086"
    "dashboard"             = "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY0YzZlOWVhZjg1ZjcwNGU3NGFmODQxMDljZjYwEgsSBxDH-KDuygEYAZIBJAoKcHJvamVjdF9pZBIWQhQxNDg5Mzg0NDczMjM4NTA3MzA4MA&filename=&opi=89354086"
    "join_class"            = "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sX2QwZDA1MDAwN2M0OTQzYzFhYmZmZjZlYjcxMDAyNDQ3EgsSBxDH-KDuygEYAZIBJAoKcHJvamVjdF9pZBIWQhQxNDg5Mzg0NDczMjM4NTA3MzA4MA&filename=&opi=89354086"
}

foreach ($name in $screens.Keys) {
    echo "Downloading $name..."
    $outFile = Join-Path $tempDir "$name.html"
    $success = $false
    for ($i = 0; $i -lt 3; $i++) {
        Invoke-WebRequest -Uri $screens[$name] -OutFile $outFile
        $content = Get-Content -Path $outFile -TotalCount 1
        if ($content -ne "OK") {
            $success = $true
            break
        }
        echo "Retry $i for $name..."
        Start-Sleep -Seconds 2
    }
    if (-not $success) { echo "FAILED to download $name" }
    Start-Sleep -Seconds 1
}

echo "Downloads complete."

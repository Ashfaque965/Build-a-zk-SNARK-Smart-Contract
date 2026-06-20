# Windows Setup Guide for zk-SNARK Project

This guide covers Windows-specific installation for this zk-SNARK project.

## Prerequisites Checklist

- [ ] Windows 10/11
- [ ] Administrator access (for PATH changes)
- [ ] Internet connection (for downloads)

## Step 1: Install Node.js

### Download and Install

1. Visit https://nodejs.org/
2. Download **LTS version** (e.g., v20.x.x LTS)
3. Run the installer
4. Follow the wizard:
   - Accept license
   - Choose installation path
   - Check "Add to PATH" ✓
   - Continue through all steps

### Verify Installation

Open PowerShell and run:
```powershell
node --version
npm --version
```

Expected output:
```
v20.x.x
9.x.x
```

## Step 2: Install Circom Compiler

### Download Executable

1. Go to https://github.com/iden3/circom/releases
2. Look for "Assets" section
3. Download `circom-windows-amd64.exe` (or your architecture)
4. Save to a folder, e.g., `C:\circom\`

### Add to PATH

**Option A: Using GUI (Recommended)**

1. Press `Windows Key + Pause` to open System
2. Click "Advanced system settings"
3. Click "Environment Variables"
4. Under "System variables", find "Path"
5. Click "Edit"
6. Click "New"
7. Type: `C:\circom` (or your circom folder)
8. Click OK, OK, OK
9. **Restart PowerShell/VS Code**

**Option B: Using PowerShell (Admin)**

```powershell
# Run as Administrator
$CircomPath = "C:\circom"
[Environment]::SetEnvironmentVariable("Path", "$env:Path;$CircomPath", "Machine")
```

Restart PowerShell after running.

### Verify Installation

```powershell
circom --version
```

Should show version number (e.g., `circom compiler 2.1.8`)

**If it doesn't work:**
- Check that `C:\circom\circom.exe` exists
- Restart PowerShell completely
- Try running from the folder: `C:\circom\circom.exe --version`

## Step 3: Clone/Create Project

Navigate to your project folder:

```powershell
cd "Build a zk-SNARK Smart Contract"
```

## Step 4: Initialize Node Project

```powershell
npm install
```

Wait for installation to complete (may take 2-3 minutes).

## Step 5: Verify Everything Works

Test Circom:
```powershell
npm run circuit:compile
```

If successful, you'll see:
```
pragma circom 2.0.0;
...
✓ Circuit compiled successfully
```

## Troubleshooting on Windows

### Issue: "npm: The term 'npm' is not recognized"

**Solution:**
```powershell
# Restart Node.js might not be in PATH
# Option 1: Reinstall Node.js with PATH option checked
# Option 2: Add C:\Program Files\nodejs to PATH manually
# Option 3: Close and reopen PowerShell (sometimes PATH updates slowly)
```

### Issue: "circom: The term 'circom' is not recognized"

**Solution:**
```powershell
# Check if circom.exe exists and PATH is set
Test-Path "C:\circom\circom.exe"  # Should return True

# If False, download again from GitHub releases
# If True, verifyPATH:
$env:Path -split ';' | Where-Object { $_ -like '*circom*' }

# If not shown, add manually via Environment Variables GUI
```

### Issue: "Access Denied" when adding to PATH

**Solution:**
- Run PowerShell as Administrator
- Use GUI method instead of PowerShell

### Issue: "Cannot find module 'circomlib'"

**Solution:**
```powershell
# circomlib should install automatically with npm install
# Try manual installation:
npm install circomlib

# Then retry:
npm run circuit:compile
```

### Issue: Script execution disabled

If you get:
```
cannot run .ps1 scripts because execution of scripts is disabled
```

Run as Administrator:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Issue: "Port 8545 already in use" during hardhat node

**Solution:**
```powershell
# The port is already in use by another process
# Option 1: Kill the previous process
Get-Process | Where-Object {$_.Name -like "*node*"} | Stop-Process

# Option 2: Use a different port
npx hardhat node --port 8546
```

### Issue: Long file paths cause problems

Windows has a 260-character path limit. If you get path errors:

**Solution:**
```powershell
# Move project closer to root
cd C:\
mkdir zk-projects
cd zk-projects
# Then clone/create project

# Or enable long paths (Windows 10+, Admin):
New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" -Name "LongPathsEnabled" -Value 1
```

## Git Integration (Optional)

If using Git:

```powershell
# Install Git from https://gitforwindows.org/
# Then clone:
git clone <repository-url>
cd "Build a zk-SNARK Smart Contract"
npm install
```

## Running Commands on Windows

### PowerShell vs Command Prompt

All commands work in both PowerShell and Command Prompt. Examples:

**PowerShell:**
```powershell
npm run circuit:compile
npm run circuit:proof
npm run deploy
```

**Command Prompt (cmd.exe):**
```cmd
npm run circuit:compile
npm run circuit:proof
npm run deploy
```

**Git Bash (if installed):**
```bash
npm run circuit:compile
npm run circuit:proof
npm run deploy
```

### Running Multiple Terminals

For Hardhat node + deploy in parallel:

**Terminal 1 (Start Hardhat):**
```powershell
# PowerShell Tab 1
npx hardhat node
```

**Terminal 2 (Deploy):**
```powershell
# PowerShell Tab 2 or New Window
npm run deploy
```

**Terminal 3 (Test):**
```powershell
# PowerShell Tab 3 or New Window
npm run verify-test
```

### Creating PowerShell Scripts

Create `setup.ps1`:

```powershell
# Colors
$Green = "`e[32m"
$Yellow = "`e[33m"
$Reset = "`e[0m"

Write-Host "${Yellow}Installing dependencies...${Reset}"
npm install

Write-Host "${Yellow}Compiling circuit...${Reset}"
npm run circuit:compile

Write-Host "${Green}Setup complete!${Reset}"
```

Run it:
```powershell
.\setup.ps1
```

## Performance Tips for Windows

1. **Antivirus Impact**: Antivirus scanning can slow down npm/circom
   - Add project folder to exclusions if very slow

2. **Disk Space**: Ensure at least 20GB free
   - Powers of tau file is ~2.3GB
   - Project with dependencies is ~2GB

3. **RAM**: Circom compilation needs 2GB+ RAM
   - Close other applications if running slow

## VS Code Integration

If using VS Code on Windows:

1. Open project folder in VS Code
2. Open integrated terminal (`Ctrl + ↓`)
3. Run commands:
   ```powershell
   npm run circuit:compile
   npm run circuit:proof
   # etc.
   ```

## Certificate Issues

If you get SSL certificate errors:

```powershell
# Temporary fix (development only):
npm config set strict-ssl false

# Better: Update certificates
npm install -g node-gyp

# For production, fix root cause:
# Check if Windows clock is correct (affects SSL validation)
Get-Date
```

## Next Steps

After successful installation:

1. Follow [TUTORIAL.md](TUTORIAL.md) for step-by-step guide
2. Review [README.md](README.md) for project overview
3. Check [EXAMPLES.md](EXAMPLES.md) for use cases

## Getting Help

### Windows-Specific Issues
- https://docs.microsoft.com/en-us/
- Check Event Viewer for errors: `eventvwr.msc`

### Node.js & npm Issues
- https://nodejs.org/en/docs/
- https://docs.npmjs.com/

### Circom & zk Issues
- https://docs.circom.io/
- https://github.com/iden3/circom/issues

### Project-Specific
- See [README.md](README.md) troubleshooting section
- Check script output for specific errors

---

**Happy developing on Windows! 🪟**

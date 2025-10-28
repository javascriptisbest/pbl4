# CHAT APP - HUONG DAN SU DUNG

## 3 CACH KHOI DONG:

### 1. INTERACTIVE MODE (De nhat):

```powershell
.\start.ps1
```

- Script se hoi ban muon dung localhost hay network
- Chi can nhan Enter cho localhost
- Hoac nhap IP cua may backend cho network mode
- Tu dong tao config va co the khoi dong luon

### 2. COMMAND LINE (Nhanh):

```powershell
# Localhost
.\setup-ip.ps1

# Network voi IP cu the
.\setup-ip.ps1 192.168.1.100
```

### 3. THU CONG:

```powershell
# Terminal 1
cd backend
npm run dev

# Terminal 2
cd frontend
npm run dev
```

## CAC TINH HUONG SU DUNG:

### A. Test tren cung may:

```powershell
.\start.ps1
# Nhan Enter khi duoc hoi
```

### B. Test tren 2 may khac nhau:

```powershell
.\start.ps1
# Nhap IP cua may backend (vi du: 192.168.1.218)
```

### C. Khoi dong nhanh voi IP co dinh:

```powershell
.\setup-ip.ps1 192.168.1.218
```

## KIEM TRA IP MAY:

```powershell
ipconfig | findstr "IPv4"
```

## TEST ACCOUNTS:

- Email: emma.thompson@example.com
- Password: 123456

## LUU Y:

- Port 5002: Backend API
- Port 5174: Frontend
- Can mo firewall cho 2 port nay
- Backend tu dong listen tren tat ca IP (0.0.0.0)

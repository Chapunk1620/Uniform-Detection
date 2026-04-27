# 🧥 Uniform Detection

## 🚀 Clone the Repository

```bash
git clone https://github.com/7078-cj/Uniform-Detection.git
cd Uniform-Detection
```

---

## 📋 Requirements

- Python 3.12 recommended
- Node.js 18 or newer
- npm 9 or newer
- Enough RAM and disk space for ML/computer-vision dependencies such as `torch`, `torchvision`, `opencv-python`, and `ultralytics`

> ⚠️ The backend is resource-heavy on first install because it includes machine-learning and image-processing packages.

---

## 🔧 Backend Setup

Run the following commands from the repository root unless stated otherwise.

1. Create a virtual environment:
   ```bash
   virtualenv env
   ```

2. Activate the virtual environment:
   - On **Windows**:
     ```bash
     env\Scripts\activate
     ```
   - On **Linux/macOS**:
     ```bash
     source env/bin/activate
     ```

3. Install backend dependencies from the repository root:
   ```bash
   pip install -r requirements.txt
   ```

4. Move into the `backend` folder and create a `.env` file from `.env.example`:
   - On **Windows**:
     ```powershell
     cd backend
     Copy-Item .env.example .env
     ```
   - On **Linux/macOS**:
     ```bash
     cd backend
     cp .env.example .env
     ```

5. Update the values in `backend/.env` that are specific to your machine or account:
   ```env
   SECRET_KEY=replace-this-with-a-random-secret-key
   EMAIL_HOST_USER=your-email@example.com
   EMAIL_HOST_PASSWORD=your-email-app-password
   ```

   The rest of the defaults in `.env.example` already work for local development with SQLite and a frontend running on `http://127.0.0.1:5173`.

   If you do not need email features during local development, you can leave `EMAIL_HOST_USER` and `EMAIL_HOST_PASSWORD` empty.

   > 🔐 *Use an app password if you're using a Google account. You can [learn how to create one here](https://support.google.com/accounts/answer/185833?hl=en).*

6. Apply the database migrations from the `backend` folder:
   ```bash
   python manage.py migrate
   ```

7. Run the backend server from the `backend` folder:
   ```bash
   python manage.py runserver
   ```

---

## 🌐 Frontend Setup

1. Open a new terminal in the repository root, then navigate to the frontend folder:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a frontend `.env` file from `.env.example`:
   - On **Windows**:
     ```powershell
     Copy-Item .env.example .env
     ```
   - On **Linux/macOS**:
     ```bash
     cp .env.example .env
     ```

4. Make sure `frontend/.env` points to the backend:
   ```env
   VITE_API_BASE_URL=http://127.0.0.1:8000
   ```

5. Start the frontend development server:
   ```bash
   npm run dev
   ```

---

## ✅ You're all set!

- Backend: [http://localhost:8000](http://localhost:8000)
- Frontend: [http://localhost:5173](http://localhost:5173) *(default Vite port)*


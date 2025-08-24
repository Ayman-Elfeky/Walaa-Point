#!/bin/bash

# Loyalty App Startup Script
# This script starts both backend and frontend servers on 0.0.0.0

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
BACKEND_DIR="backend"
FRONTEND_DIR="frontend"
BACKEND_PORT=${BACKEND_PORT:-7000}
FRONTEND_PORT=${FRONTEND_PORT:-3000}
LOG_DIR="logs"
PID_DIR="pids"

# Create necessary directories
mkdir -p "$LOG_DIR" "$PID_DIR"

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${CYAN}================================${NC}"
    echo -e "${CYAN}   Loyalty App Startup Script   ${NC}"
    echo -e "${CYAN}================================${NC}"
}

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to kill process on port
kill_port() {
    local port=$1
    if check_port $port; then
        print_warning "Port $port is in use. Killing existing process..."
        lsof -ti:$port | xargs kill -9 2>/dev/null || true
        sleep 2
    fi
}

# Function to check if Node.js is installed
check_node() {
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js first."
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm first."
        exit 1
    fi
    
    print_status "Node.js version: $(node --version)"
    print_status "npm version: $(npm --version)"
}

# Function to install dependencies
install_dependencies() {
    print_status "Installing backend dependencies..."
    cd "$BACKEND_DIR"
    npm install
    cd ..
    
    print_status "Installing frontend dependencies..."
    cd "$FRONTEND_DIR"
    npm install
    cd ..
}

# Function to start backend
start_backend() {
    print_status "Starting backend server on 0.0.0.0:$BACKEND_PORT..."
    
    # Kill any existing process on backend port
    kill_port $BACKEND_PORT
    
    cd "$BACKEND_DIR"
    
    # Set environment variables if not already set
    export PORT=${PORT:-$BACKEND_PORT}
    export NODE_ENV=${NODE_ENV:-development}
    export API_PREFIX=${API_PREFIX:-/api/v1}
    
    # Start backend with PM2 or directly
    if command -v pm2 &> /dev/null; then
        print_status "Using PM2 to manage backend process..."
        pm2 start server.js --name "loyalty-backend" --log "$LOG_DIR/backend.log" --error "$LOG_DIR/backend-error.log" --time
        pm2 save
    else
        print_warning "PM2 not found. Starting backend directly..."
        nohup node server.js > "$LOG_DIR/backend.log" 2> "$LOG_DIR/backend-error.log" &
        echo $! > "$PID_DIR/backend.pid"
    fi
    
    cd ..
    
    # Wait for backend to start
    print_status "Waiting for backend to start..."
    for i in {1..30}; do
        if check_port $BACKEND_PORT; then
            print_status "Backend is running on http://0.0.0.0:$BACKEND_PORT"
            break
        fi
        sleep 1
    done
    
    if ! check_port $BACKEND_PORT; then
        print_error "Backend failed to start on port $BACKEND_PORT"
        exit 1
    fi
}

# Function to start frontend
start_frontend() {
    print_status "Starting frontend server on 0.0.0.0:$FRONTEND_PORT..."
    
    # Kill any existing process on frontend port
    kill_port $FRONTEND_PORT
    
    cd "$FRONTEND_DIR"
    
    # Start frontend with PM2 or directly
    if command -v pm2 &> /dev/null; then
        print_status "Using PM2 to manage frontend process..."
        pm2 start "npm run dev" --name "loyalty-frontend" --log "$LOG_DIR/frontend.log" --error "$LOG_DIR/frontend-error.log" --time
        pm2 save
    else
        print_warning "PM2 not found. Starting frontend directly..."
        nohup npm run dev > "$LOG_DIR/frontend.log" 2> "$LOG_DIR/frontend-error.log" &
        echo $! > "$PID_DIR/frontend.pid"
    fi
    
    cd ..
    
    # Wait for frontend to start
    print_status "Waiting for frontend to start..."
    for i in {1..30}; do
        if check_port $FRONTEND_PORT; then
            print_status "Frontend is running on http://0.0.0.0:$FRONTEND_PORT"
            break
        fi
        sleep 1
    done
    
    if ! check_port $FRONTEND_PORT; then
        print_error "Frontend failed to start on port $FRONTEND_PORT"
        exit 1
    fi
}

# Function to show status
show_status() {
    echo -e "\n${PURPLE}=== Application Status ===${NC}"
    
    if check_port $BACKEND_PORT; then
        echo -e "${GREEN}✓ Backend: http://0.0.0.0:$BACKEND_PORT${NC}"
    else
        echo -e "${RED}✗ Backend: Not running${NC}"
    fi
    
    if check_port $FRONTEND_PORT; then
        echo -e "${GREEN}✓ Frontend: http://0.0.0.0:$FRONTEND_PORT${NC}"
    else
        echo -e "${RED}✗ Frontend: Not running${NC}"
    fi
    
    echo -e "\n${PURPLE}=== Log Files ===${NC}"
    echo -e "Backend logs: $LOG_DIR/backend.log"
    echo -e "Frontend logs: $LOG_DIR/frontend.log"
    echo -e "Error logs: $LOG_DIR/*-error.log"
    
    if command -v pm2 &> /dev/null; then
        echo -e "\n${PURPLE}=== PM2 Status ===${NC}"
        pm2 status
    fi
}

# Function to stop all services
stop_services() {
    print_status "Stopping all services..."
    
    if command -v pm2 &> /dev/null; then
        pm2 stop loyalty-backend loyalty-frontend 2>/dev/null || true
        pm2 delete loyalty-backend loyalty-frontend 2>/dev/null || true
    fi
    
    # Kill processes by PID files
    if [ -f "$PID_DIR/backend.pid" ]; then
        kill $(cat "$PID_DIR/backend.pid") 2>/dev/null || true
        rm "$PID_DIR/backend.pid"
    fi
    
    if [ -f "$PID_DIR/frontend.pid" ]; then
        kill $(cat "$PID_DIR/frontend.pid") 2>/dev/null || true
        rm "$PID_DIR/frontend.pid"
    fi
    
    # Kill processes by port
    kill_port $BACKEND_PORT
    kill_port $FRONTEND_PORT
    
    print_status "All services stopped."
}

# Function to show logs
show_logs() {
    local service=$1
    case $service in
        "backend")
            if [ -f "$LOG_DIR/backend.log" ]; then
                tail -f "$LOG_DIR/backend.log"
            else
                print_error "Backend log file not found"
            fi
            ;;
        "frontend")
            if [ -f "$LOG_DIR/frontend.log" ]; then
                tail -f "$LOG_DIR/frontend.log"
            else
                print_error "Frontend log file not found"
            fi
            ;;
        *)
            print_error "Usage: $0 logs [backend|frontend]"
            exit 1
            ;;
    esac
}

# Function to show help
show_help() {
    echo -e "${CYAN}Loyalty App Startup Script${NC}"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  start     Start both backend and frontend servers"
    echo "  stop      Stop all services"
    echo "  restart   Restart all services"
    echo "  status    Show current status"
    echo "  logs      Show logs (use: $0 logs [backend|frontend])"
    echo "  install   Install dependencies"
    echo "  help      Show this help message"
    echo ""
    echo "Environment variables:"
    echo "  BACKEND_PORT   Backend port (default: 7000)"
    echo "  FRONTEND_PORT  Frontend port (default: 3000)"
    echo "  NODE_ENV       Node environment (default: development)"
    echo ""
}

# Main script logic
case "${1:-start}" in
    "start")
        print_header
        check_node
        install_dependencies
        start_backend
        start_frontend
        show_status
        print_status "Application started successfully!"
        print_status "Access your app at: http://0.0.0.0:$FRONTEND_PORT"
        print_status "API available at: http://0.0.0.0:$BACKEND_PORT"
        ;;
    "stop")
        stop_services
        ;;
    "restart")
        stop_services
        sleep 2
        $0 start
        ;;
    "status")
        show_status
        ;;
    "logs")
        show_logs $2
        ;;
    "install")
        print_header
        check_node
        install_dependencies
        print_status "Dependencies installed successfully!"
        ;;
    "help"|"-h"|"--help")
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        show_help
        exit 1
        ;;
esac

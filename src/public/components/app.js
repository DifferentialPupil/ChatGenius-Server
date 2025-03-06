document.addEventListener('DOMContentLoaded', () => {
    // Define available components
    const components = [
        'user', 'workspace', 'workspace-member', 'channel', 'channel-member', 'message', 
        'direct-message', 'file', 'reaction', 'thread', 'mention', 
        'pinned-item', 'notification', 'ai-avatar', 'admin', 'subscription-plan'
    ];
    
    // Auth token storage
    let authToken = localStorage.getItem('authToken') || '';
    
    // Function to load component
    const loadComponent = async (componentName) => {
        try {
            const componentContainer = document.getElementById('component-container');
            
            // Show loading indicator
            document.getElementById('loading-indicator').style.display = 'block';
            
            // Remove any existing component
            const existingComponents = componentContainer.querySelectorAll('[id$="-component"]');
            existingComponents.forEach(component => {
                if (component.id !== `${componentName}-component`) {
                    component.style.display = 'none';
                }
            });
            
            // Check if component is already loaded
            const existingComponent = document.getElementById(`${componentName}-component`);
            if (existingComponent) {
                existingComponent.style.display = 'block';
                document.getElementById('loading-indicator').style.display = 'none';
                return;
            }
            
            // Fetch the component
            const response = await fetch(`/components/${componentName}.html`);
            if (!response.ok) {
                throw new Error(`Failed to load ${componentName} component`);
            }
            
            const html = await response.text();
            componentContainer.innerHTML += html;
            
            // Initialize component functionality
            initializeComponent(componentName);
            
            // Hide loading indicator
            document.getElementById('loading-indicator').style.display = 'none';
            
            consoleLog(`Loaded ${componentName} component`);
        } catch (error) {
            console.error(`Error loading component ${componentName}:`, error);
            document.getElementById('loading-indicator').style.display = 'none';
            consoleLog(`Error: ${error.message}`, 'error');
        }
    };
    
    // Function to initialize component-specific functionality
    const initializeComponent = (componentName) => {
        const component = document.getElementById(`${componentName}-component`);
        if (!component) return;
        
        // Add event listeners to all test endpoint buttons in the component
        const testButtons = component.querySelectorAll('.test-endpoint');
        testButtons.forEach(button => {
            button.addEventListener('click', handleEndpointTest);
        });
    };
    
    // Function to handle endpoint test
    const handleEndpointTest = async (event) => {
        const button = event.currentTarget;
        const method = button.getAttribute('data-method');
        let endpoint = button.getAttribute('data-endpoint');
        const hasBody = button.getAttribute('data-has-body') === 'true';
        const isFileUpload = button.getAttribute('data-is-file-upload') === 'true';
        const bodyFields = button.getAttribute('data-body-fields');
        const replaceParams = button.getAttribute('data-replace-params');
        const queryParams = button.getAttribute('data-query-params');
        const customQueryString = button.getAttribute('data-custom-query-string');
        
        // Show spinner
        const spinner = button.querySelector('.spinner-icon');
        spinner.style.display = 'inline-block';
        
        // Get the response area
        const responseArea = button.nextElementSibling;
        const codeElement = responseArea.querySelector('code');
        
        try {
            // Replace URL parameters if needed
            if (replaceParams) {
                const paramPairs = replaceParams.split(',');
                paramPairs.forEach(pair => {
                    const [paramName, inputId] = pair.split(':');
                    const paramValue = document.getElementById(inputId).value;
                    if (!paramValue) {
                        throw new Error(`Please provide a value for ${paramName}`);
                    }
                    endpoint = endpoint.replace(`{${paramName}}`, paramValue);
                });
            }
            
            // Handle custom query string (direct from input field)
            if (customQueryString) {
                const queryInputValue = document.getElementById(customQueryString).value;
                if (queryInputValue && queryInputValue.trim() !== '') {
                    endpoint += `?${queryInputValue}`;
                }
            }
            // Add query parameters if needed
            else if (queryParams) {
                const paramPairs = queryParams.split(',');
                const queryArray = [];
                
                paramPairs.forEach(pair => {
                    const [paramName, inputId] = pair.split(':');
                    const paramValue = document.getElementById(inputId).value;
                    if (paramValue) {
                        queryArray.push(`${paramName}=${encodeURIComponent(paramValue)}`);
                    }
                });
                
                if (queryArray.length > 0) {
                    endpoint += `?${queryArray.join('&')}`;
                }
            }
            
            // Prepare the request
            const options = {
                method,
                headers: {}
            };
            
            // Add auth token if available
            if (authToken) {
                options.headers['Authorization'] = `Bearer ${authToken}`;
            }
            
            // Handle request body
            if (hasBody) {
                if (isFileUpload) {
                    const fileInput = document.getElementById('file-upload-input');
                    if (!fileInput.files.length) {
                        throw new Error('Please select a file to upload');
                    }
                    
                    const formData = new FormData();
                    formData.append('file', fileInput.files[0]);
                    options.body = formData;
                    
                    // Don't set Content-Type for FormData, browser will set it with boundary
                    delete options.headers['Content-Type'];
                } else {
                    options.headers['Content-Type'] = 'application/json';
                    
                    let bodyData = {};
                    if (bodyFields) {
                        const fieldPairs = bodyFields.split(',');
                        fieldPairs.forEach(pair => {
                            const [fieldName, inputId] = pair.split(':');
                            const input = document.getElementById(inputId);
                            
                            if (input.value) {
                                try {
                                    // Special case: if field name is "body", use the entire JSON content directly
                                    if (fieldName === 'body' && input.tagName === 'TEXTAREA') {
                                        // Check if the value starts with { or [ (indicating JSON)
                                        if (input.value.trim().startsWith('{') || input.value.trim().startsWith('[')) {
                                            try {
                                                bodyData = JSON.parse(input.value);
                                            } catch (e) {
                                                throw new Error(`Invalid JSON in textarea: ${e.message}`);
                                            }
                                        } 
                                        // Special case for user status - if plain text is entered, wrap it in a statusText field
                                        else if (inputId === 'user-put-status-body') {
                                            bodyData = { statusText: input.value };
                                        }
                                        // For other textareas with non-JSON content
                                        else {
                                            bodyData[fieldName] = input.value;
                                        }
                                    } 
                                    // Check if the field is meant to be JSON
                                    else if (input.tagName === 'TEXTAREA' && input.value.trim().startsWith('{')) {
                                        bodyData[fieldName] = JSON.parse(input.value);
                                    } else {
                                        // Convert to appropriate type
                                        if (input.type === 'number') {
                                            bodyData[fieldName] = Number(input.value);
                                        } else if (input.value === 'true' || input.value === 'false') {
                                            bodyData[fieldName] = input.value === 'true';
                                        } else {
                                            bodyData[fieldName] = input.value;
                                        }
                                    }
                                } catch (error) {
                                    throw new Error(`Invalid JSON in field ${fieldName}: ${error.message}`);
                                }
                            }
                        });
                    }
                    
                    options.body = JSON.stringify(bodyData);
                }
            }
            
            consoleLog(`Sending ${method} request to ${endpoint}`);
            if (options.body && !isFileUpload) {
                consoleLog(`Request body: ${options.body}`);
            }
            
            // Send the request
            const response = await fetch(endpoint, options);
            const contentType = response.headers.get('content-type');
            
            let responseData;
            if (contentType && contentType.includes('application/json')) {
                responseData = await response.json();
            } else {
                responseData = await response.text();
            }
            
            // Display the response
            let formattedResponse;
            if (typeof responseData === 'object') {
                formattedResponse = JSON.stringify(responseData, null, 2);
            } else {
                formattedResponse = responseData;
            }
            
            codeElement.textContent = formattedResponse;
            responseArea.style.display = 'block';
            
            // Log the response
            consoleLog(`Response (${response.status} ${response.statusText})`);
            if (typeof responseData === 'object') {
                consoleLog(`Response data: ${JSON.stringify(responseData)}`);
            }
            
            // Highlight the code
            if (window.hljs) {
                hljs.highlightElement(codeElement);
            }
        } catch (error) {
            console.error('Error testing endpoint:', error);
            codeElement.textContent = `Error: ${error.message}`;
            responseArea.style.display = 'block';
            consoleLog(`Error: ${error.message}`, 'error');
        } finally {
            // Hide spinner
            spinner.style.display = 'none';
        }
    };
    
    // Console logging function
    window.consoleLog = (message, type = 'info') => {
        const consoleOutput = document.getElementById('console-output');
        const entry = document.createElement('div');
        entry.className = 'console-entry';
        entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
        
        if (type === 'error') {
            entry.style.color = '#dc3545';
        }
        
        consoleOutput.appendChild(entry);
        consoleOutput.scrollTop = consoleOutput.scrollHeight;
    };
    
    // Set up console toggle
    document.querySelector('.console-toggle').addEventListener('click', () => {
        const consoleOutput = document.getElementById('console-output');
        consoleOutput.style.display = consoleOutput.style.display === 'none' ? 'block' : 'none';
    });
    
    // Set up auth token button
    document.querySelector('.set-auth-token').addEventListener('click', () => {
        const token = prompt('Enter your authorization token:', authToken);
        if (token !== null) {
            authToken = token;
            localStorage.setItem('authToken', token);
            consoleLog(`Auth token ${token ? 'updated' : 'cleared'}`);
        }
    });
    
    // Set up navigation
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            
            // Remove active class from all links
            navLinks.forEach(l => l.classList.remove('active'));
            
            // Add active class to clicked link
            link.classList.add('active');
            
            // Get component name from href
            const href = link.getAttribute('href');
            const componentName = href.replace('#', '');
            
            // Load the component
            loadComponent(componentName);
        });
    });
    
    // Load the initial component (user)
    loadComponent('user');
}); 
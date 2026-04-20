/**
 * Mobile UI Helpers for Madani Maktab PWA
 * Provides native-like mobile interactions and components
 * Level 2: Optional helpers - use what you need!
 */

const MobileUI = {
    
    // ========================================================================
    // DEVICE DETECTION
    // ========================================================================
    
    /**
     * Check if user is on mobile device
     */
    isMobile() {
        return window.innerWidth <= 768;
    },
    
    /**
     * Check if user is on tablet
     */
    isTablet() {
        return window.innerWidth > 768 && window.innerWidth <= 1024;
    },
    
    /**
     * Check if touch device
     */
    isTouchDevice() {
        return ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    },
    
    // ========================================================================
    // HAPTIC FEEDBACK (Android)
    // ========================================================================
    
    /**
     * Trigger haptic feedback (vibration)
     */
    haptic(pattern = 10) {
        if ('vibrate' in navigator) {
            navigator.vibrate(pattern);
        }
    },
    
    /**
     * Light haptic feedback
     */
    hapticLight() {
        this.haptic(10);
    },
    
    /**
     * Medium haptic feedback
     */
    hapticMedium() {
        this.haptic(20);
    },
    
    /**
     * Success haptic pattern
     */
    hapticSuccess() {
        this.haptic([10, 50, 10]);
    },
    
    /**
     * Error haptic pattern
     */
    hapticError() {
        this.haptic([50, 100, 50]);
    },
    
    // ========================================================================
    // TOAST NOTIFICATIONS
    // ========================================================================
    
    /**
     * Show toast notification
     * @param {string} message - Message to display
     * @param {string} type - 'success', 'error', 'warning', or 'info'
     * @param {number} duration - Duration in milliseconds (default: 3000)
     */
    showToast(message, type = 'info', duration = 3000) {
        // Create toast element
        const toast = document.createElement('div');
        toast.className = `mobile-toast ${type}`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        // Show toast
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        
        // Hide and remove toast
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, duration);
        
        // Haptic feedback
        if (type === 'success') {
            this.hapticSuccess();
        } else if (type === 'error') {
            this.hapticError();
        } else {
            this.hapticLight();
        }
    },
    
    // ========================================================================
    // BOTTOM SHEET
    // ========================================================================
    
    /**
     * Show bottom sheet modal
     * @param {string|HTMLElement} content - Content to display
     * @param {object} options - Configuration options
     */
    showBottomSheet(content, options = {}) {
        const defaults = {
            dismissible: true,
            height: 'auto',
            onClose: null
        };
        const config = { ...defaults, ...options };
        
        // Create overlay
        const overlay = document.createElement('div');
        overlay.className = 'bottom-sheet-overlay';
        
        // Create bottom sheet
        const sheet = document.createElement('div');
        sheet.className = 'bottom-sheet';
        
        // Add handle
        const handle = document.createElement('div');
        handle.className = 'bottom-sheet-handle';
        sheet.appendChild(handle);
        
        // Add content
        const contentDiv = document.createElement('div');
        contentDiv.className = 'bottom-sheet-content';
        
        if (typeof content === 'string') {
            contentDiv.innerHTML = content;
        } else {
            contentDiv.appendChild(content.cloneNode(true));
        }
        
        sheet.appendChild(contentDiv);
        
        // Add to DOM
        document.body.appendChild(overlay);
        document.body.appendChild(sheet);
        
        // Show with animation
        setTimeout(() => {
            overlay.classList.add('active');
            sheet.classList.add('active');
        }, 10);
        
        // Close function
        const closeSheet = () => {
            overlay.classList.remove('active');
            sheet.classList.remove('active');
            
            setTimeout(() => {
                document.body.removeChild(overlay);
                document.body.removeChild(sheet);
                if (config.onClose) config.onClose();
            }, 300);
        };
        
        // Close on overlay click
        if (config.dismissible) {
            overlay.addEventListener('click', closeSheet);
            
            // Swipe down to dismiss
            let startY = 0;
            handle.addEventListener('touchstart', (e) => {
                startY = e.touches[0].clientY;
            });
            
            handle.addEventListener('touchmove', (e) => {
                const deltaY = e.touches[0].clientY - startY;
                if (deltaY > 0) {
                    sheet.style.transform = `translateY(${deltaY}px)`;
                }
            });
            
            handle.addEventListener('touchend', (e) => {
                const deltaY = e.changedTouches[0].clientY - startY;
                if (deltaY > 100) {
                    closeSheet();
                } else {
                    sheet.style.transform = 'translateY(0)';
                }
            });
        }
        
        return { close: closeSheet };
    },
    
    // ========================================================================
    // PULL TO REFRESH
    // ========================================================================
    
    /**
     * Enable pull-to-refresh on an element
     * @param {string} selector - Element selector
     * @param {function} onRefresh - Callback function
     */
    enablePullToRefresh(selector, onRefresh) {
        const element = document.querySelector(selector);
        if (!element) return;
        
        let startY = 0;
        let pulling = false;
        const threshold = 80;
        
        // Create refresh indicator
        const indicator = document.createElement('div');
        indicator.className = 'pull-to-refresh';
        indicator.innerHTML = '<div class="pull-to-refresh-icon">↻</div>';
        element.parentElement.insertBefore(indicator, element);
        
        element.addEventListener('touchstart', (e) => {
            if (element.scrollTop === 0) {
                startY = e.touches[0].clientY;
            }
        }, { passive: true });
        
        element.addEventListener('touchmove', (e) => {
            if (element.scrollTop === 0) {
                const deltaY = e.touches[0].clientY - startY;
                if (deltaY > 0 && deltaY < threshold * 2) {
                    pulling = true;
                    const pullDistance = Math.min(deltaY, threshold);
                    indicator.style.transform = `translateY(${pullDistance - 60}px)`;
                }
            }
        }, { passive: true });
        
        element.addEventListener('touchend', async (e) => {
            if (pulling) {
                const deltaY = e.changedTouches[0].clientY - startY;
                if (deltaY >= threshold) {
                    // Trigger refresh
                    indicator.classList.add('pulling');
                    this.hapticMedium();
                    
                    try {
                        await onRefresh();
                        this.hapticSuccess();
                        this.showToast('تازہ ہو گیا! Refreshed!', 'success', 2000);
                    } catch (error) {
                        this.hapticError();
                        this.showToast('Refresh failed', 'error');
                    }
                }
                
                // Reset
                indicator.style.transform = 'translateY(-60px)';
                indicator.classList.remove('pulling');
                pulling = false;
            }
        });
    },
    
    // ========================================================================
    // SWIPE GESTURES
    // ========================================================================
    
    /**
     * Enable swipe gestures on elements
     * @param {string} selector - Elements selector
     * @param {object} options - Swipe configuration
     */
    enableSwipe(selector, options = {}) {
        const defaults = {
            onSwipeLeft: null,
            onSwipeRight: null,
            threshold: 80
        };
        const config = { ...defaults, ...options };
        
        const elements = document.querySelectorAll(selector);
        
        elements.forEach(element => {
            let startX = 0;
            let startY = 0;
            let isSwiping = false;
            
            element.addEventListener('touchstart', (e) => {
                startX = e.touches[0].clientX;
                startY = e.touches[0].clientY;
            }, { passive: true });
            
            element.addEventListener('touchmove', (e) => {
                if (!isSwiping) {
                    const deltaX = e.touches[0].clientX - startX;
                    const deltaY = e.touches[0].clientY - startY;
                    
                    // Only swipe if horizontal movement is greater than vertical
                    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
                        isSwiping = true;
                    }
                }
                
                if (isSwiping) {
                    const deltaX = e.touches[0].clientX - startX;
                    element.style.transform = `translateX(${deltaX}px)`;
                }
            }, { passive: true });
            
            element.addEventListener('touchend', (e) => {
                if (isSwiping) {
                    const deltaX = e.changedTouches[0].clientX - startX;
                    
                    if (Math.abs(deltaX) >= config.threshold) {
                        // Swipe detected
                        this.hapticLight();
                        
                        if (deltaX < 0 && config.onSwipeLeft) {
                            config.onSwipeLeft(element);
                        } else if (deltaX > 0 && config.onSwipeRight) {
                            config.onSwipeRight(element);
                        }
                    }
                    
                    // Reset position
                    element.style.transform = 'translateX(0)';
                    isSwiping = false;
                }
            });
        });
    },
    
    // ========================================================================
    // FLOATING ACTION BUTTON
    // ========================================================================
    
    /**
     * Create floating action button
     * @param {object} options - FAB configuration
     */
    createFAB(options = {}) {
        const defaults = {
            icon: 'plus',
            label: '',
            onClick: null,
            position: 'bottom-right'
        };
        const config = { ...defaults, ...options };
        
        const fab = document.createElement('button');
        fab.className = config.label ? 'fab fab-extended' : 'fab';
        
        fab.innerHTML = `
            <i class="fas fa-${config.icon}"></i>
            ${config.label ? `<span>${config.label}</span>` : ''}
        `;
        
        if (config.onClick) {
            fab.addEventListener('click', () => {
                this.hapticMedium();
                config.onClick();
            });
        }
        
        document.body.appendChild(fab);
        
        return fab;
    },
    
    /**
     * Remove FAB
     */
    removeFAB() {
        const fab = document.querySelector('.fab');
        if (fab) {
            fab.remove();
        }
    },
    
    // ========================================================================
    // BOTTOM NAVIGATION
    // ========================================================================
    
    /**
     * Update bottom navigation active state
     * @param {string} sectionId - Active section ID
     */
    updateBottomNav(sectionId) {
        const navItems = document.querySelectorAll('.mobile-bottom-nav .nav-item');
        navItems.forEach(item => {
            const href = item.getAttribute('href');
            if (href === `#${sectionId}`) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    },
    
    /**
     * Set badge count on navigation item
     * @param {string} itemId - Nav item ID
     * @param {number} count - Badge count
     */
    setNavBadge(itemId, count) {
        const navItem = document.querySelector(`[data-nav-id="${itemId}"]`);
        if (!navItem) return;
        
        let badge = navItem.querySelector('.badge');
        
        if (count > 0) {
            if (!badge) {
                badge = document.createElement('span');
                badge.className = 'badge';
                navItem.appendChild(badge);
            }
            badge.textContent = count > 99 ? '99+' : count;
        } else if (badge) {
            badge.remove();
        }
    },
    
    // ========================================================================
    // LOADING STATES
    // ========================================================================
    
    /**
     * Show loading skeleton in container
     * @param {string} selector - Container selector
     * @param {number} count - Number of skeleton cards
     */
    showLoadingSkeleton(selector, count = 3) {
        const container = document.querySelector(selector);
        if (!container) return;
        
        container.innerHTML = '';
        for (let i = 0; i < count; i++) {
            const skeleton = document.createElement('div');
            skeleton.className = 'skeleton-card loading-skeleton';
            container.appendChild(skeleton);
        }
    },
    
    /**
     * Hide loading skeleton
     * @param {string} selector - Container selector
     */
    hideLoadingSkeleton(selector) {
        const container = document.querySelector(selector);
        if (!container) return;
        
        const skeletons = container.querySelectorAll('.loading-skeleton');
        skeletons.forEach(s => s.remove());
    },
    
    // ========================================================================
    // CONFIRMATION DIALOGS
    // ========================================================================
    
    /**
     * Show mobile-friendly confirmation dialog
     * @param {string} message - Confirmation message
     * @param {string} confirmText - Confirm button text
     * @param {string} cancelText - Cancel button text
     */
    confirm(message, confirmText = 'Confirm', cancelText = 'Cancel') {
        return new Promise((resolve) => {
            const content = `
                <div style="padding: 20px; text-align: center;">
                    <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
                    <h3 style="margin-bottom: 20px; font-size: 18px;">${message}</h3>
                    <div style="display: flex; gap: 12px;">
                        <button class="btn-secondary" style="flex: 1;" id="cancel-btn">
                            ${cancelText}
                        </button>
                        <button class="btn-danger" style="flex: 1;" id="confirm-btn">
                            ${confirmText}
                        </button>
                    </div>
                </div>
            `;
            
            const sheet = this.showBottomSheet(content, {
                dismissible: false
            });
            
            setTimeout(() => {
                document.getElementById('confirm-btn').onclick = () => {
                    sheet.close();
                    this.hapticMedium();
                    resolve(true);
                };
                
                document.getElementById('cancel-btn').onclick = () => {
                    sheet.close();
                    this.hapticLight();
                    resolve(false);
                };
            }, 100);
        });
    },
    
    // ========================================================================
    // MOBILE MODALS
    // ========================================================================
    
    /**
     * Show full-screen mobile modal
     * @param {string} title - Modal title
     * @param {string|HTMLElement} content - Modal content
     */
    showMobileModal(title, content) {
        const modal = document.createElement('div');
        modal.className = 'mobile-modal';
        modal.innerHTML = `
            <div class="mobile-modal-header">
                <button class="back-button" onclick="MobileUI.closeMobileModal()">
                    <i class="fas fa-arrow-left"></i>
                </button>
                <h2>${title}</h2>
                <div style="width: 40px;"></div>
            </div>
            <div class="mobile-modal-content">
                ${typeof content === 'string' ? content : content.innerHTML}
            </div>
        `;
        
        document.body.appendChild(modal);
        
        setTimeout(() => {
            modal.classList.add('active');
        }, 10);
    },
    
    /**
     * Close mobile modal
     */
    closeMobileModal() {
        const modal = document.querySelector('.mobile-modal');
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => {
                modal.remove();
            }, 300);
        }
    },
    
    // ========================================================================
    // SCROLL UTILITIES
    // ========================================================================
    
    /**
     * Smooth scroll to element
     * @param {string} selector - Element selector
     */
    scrollTo(selector) {
        const element = document.querySelector(selector);
        if (element) {
            element.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
            });
        }
    },
    
    /**
     * Scroll to top
     */
    scrollToTop() {
        window.scrollTo({ 
            top: 0, 
            behavior: 'smooth' 
        });
    },
    
    // ========================================================================
    // COLLAPSIBLE SECTIONS (Reduce Scrolling)
    // ========================================================================
    
    /**
     * Make a section collapsible
     * @param {string} sectionSelector - Section to make collapsible
     * @param {string} title - Section title
     * @param {boolean} initiallyExpanded - Start expanded or collapsed
     */
    makeCollapsible(sectionSelector, title, initiallyExpanded = false) {
        const section = document.querySelector(sectionSelector);
        if (!section || !this.isMobile()) return;
        
        // Wrap content in collapsible structure
        const originalContent = section.innerHTML;
        
        section.innerHTML = `
            <button class="collapsible-header" onclick="MobileUI.toggleCollapsible(this)">
                <h3>${title}</h3>
                <i class="fas fa-chevron-down collapsible-icon"></i>
            </button>
            <div class="collapsible-content">
                ${originalContent}
            </div>
        `;
        
        section.classList.add('collapsible-section');
        if (initiallyExpanded) {
            section.classList.add('expanded');
        }
    },
    
    /**
     * Toggle collapsible section
     * @param {HTMLElement} header - Header element
     */
    toggleCollapsible(header) {
        const section = header.parentElement;
        section.classList.toggle('expanded');
        this.hapticLight();
    },
    
    // ========================================================================
    // COMPACT DASHBOARD HELPERS
    // ========================================================================
    
    /**
     * Initialize compact mobile dashboard
     */
    initCompactDashboard() {
        if (!this.isMobile()) return;
        
        console.log('📱 Initializing compact mobile dashboard...');
        
        // Make detailed sections collapsible
        setTimeout(() => {
            // These sections start collapsed to reduce scrolling
            const sectionsToCollapse = [
                { selector: '.dashboard-alerts-section', title: '⚠️ Alerts & Notifications', expanded: false },
                { selector: '.class-stats-section', title: '📊 Class-Wise Statistics', expanded: false },
                { selector: '.performance-section', title: '🎯 Performance Metrics', expanded: false },
                { selector: '.book-progress-section', title: '📚 Book Progress', expanded: false }
            ];
            
            sectionsToCollapse.forEach(({ selector, title, expanded }) => {
                this.makeCollapsible(selector, title, expanded);
            });
            
            // Convert class-wise stats to horizontal table
            this.convertClassStatsToTable();
            
            console.log('✅ Compact dashboard initialized');
        }, 1000); // Wait for dashboard to load
    },
    
    /**
     * Convert class-wise stats to horizontal scrollable table (Excel-like)
     */
    convertClassStatsToTable() {
        if (!this.isMobile()) return;
        
        // Wait a bit more for dashboard to fully load
        setTimeout(() => {
            // Find existing class stats sections
            const classStatsSections = document.querySelectorAll('.class-stats-section, .class-stats-grid');
            
            classStatsSections.forEach(section => {
                const existingGrid = section.querySelector('.class-stats-grid');
                if (existingGrid && !section.querySelector('.class-stats-container')) {
                    // Convert grid to table format
                    this.createHorizontalTable(section, existingGrid);
                }
            });
            
            // Also look for any dynamically created class stats
            this.observeClassStatsChanges();
            
            console.log('📊 Class-wise stats converted to horizontal table');
        }, 2000); // Wait longer for dashboard data to load
    },
    
    /**
     * Observe for changes in class stats and convert them
     */
    observeClassStatsChanges() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            // Check if this is a class stats section
                            const classStatsGrid = node.querySelector ? 
                                node.querySelector('.class-stats-grid') : null;
                            
                            if (classStatsGrid && !node.querySelector('.class-stats-container')) {
                                this.createHorizontalTable(node, classStatsGrid);
                            }
                        }
                    });
                }
            });
        });
        
        // Observe the dashboard section
        const dashboard = document.getElementById('dashboard');
        if (dashboard) {
            observer.observe(dashboard, { childList: true, subtree: true });
        }
    },
    
    /**
     * Create horizontal scrollable table from existing grid
     */
    createHorizontalTable(container, existingGrid) {
        // Create new table structure
        const tableHTML = `
            <div class="class-stats-container">
                <div class="class-stats-scrollable">
                    <table class="class-stats-table">
                        <thead>
                            <tr>
                                <th>Class</th>
                                <th>Total</th>
                                <th>Present</th>
                                <th>Absent</th>
                                <th>Rate</th>
                                <th>Inactive</th>
                                <th>Avg Score</th>
                                <th>Mustaid</th>
                                <th>Mutawassit</th>
                                <th>Mujtahid</th>
                            </tr>
                        </thead>
                        <tbody id="class-stats-table-body">
                            <!-- Data will be populated here -->
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        
        // Replace the grid with table
        existingGrid.style.display = 'none';
        container.insertAdjacentHTML('beforeend', tableHTML);
        
        // Populate table data from existing cards
        this.populateTableData();
    },
    
    /**
     * Populate table data from existing class cards
     */
    populateTableData() {
        const tableBody = document.getElementById('class-stats-table-body');
        if (!tableBody) return;
        
        // Find existing class stat cards
        const classCards = document.querySelectorAll('.class-stat-card');
        
        classCards.forEach(card => {
            const className = card.querySelector('h3, h4, .class-name')?.textContent?.trim() || 'Unknown Class';
            const stats = this.extractStatsFromCard(card);
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${className}</td>
                <td>${stats.total || '0'}</td>
                <td>${stats.present || '0'}</td>
                <td>${stats.absent || '0'}</td>
                <td>${stats.rate || '0%'}</td>
                <td>${stats.inactive || '0'}</td>
                <td>${stats.avgScore || '0'}</td>
                <td>${stats.mustaid || '0'}</td>
                <td>${stats.mutawassit || '0'}</td>
                <td>${stats.mujtahid || '0'}</td>
            `;
            
            tableBody.appendChild(row);
        });
    },
    
    /**
     * Extract statistics from a class card element
     */
    extractStatsFromCard(card) {
        const stats = {};
        
        // Look for common patterns in the card
        const text = card.textContent;
        const numbers = text.match(/\d+/g) || [];
        
        // Try to extract specific values based on context
        stats.total = numbers[0] || '0';
        stats.present = numbers[1] || '0';
        stats.absent = numbers[2] || '0';
        stats.inactive = numbers[3] || '0';
        stats.avgScore = numbers[4] || '0';
        stats.mustaid = numbers[5] || '0';
        stats.mutawassit = numbers[6] || '0';
        stats.mujtahid = numbers[7] || '0';
        
        // Try to find percentage
        const rateMatch = text.match(/(\d+)%/);
        stats.rate = rateMatch ? rateMatch[1] + '%' : '0%';
        
        return stats;
    },
    
    /**
     * Create horizontal table from class data (to be called from dashboard.js)
     * @param {Object} classData - Object with class statistics
     */
    createClassStatsTable(classData) {
        if (!this.isMobile()) return;
        
        // Find or create class stats section
        let classStatsSection = document.querySelector('.class-stats-section');
        if (!classStatsSection) {
            // Create the section if it doesn't exist
            const dashboard = document.getElementById('dashboard');
            if (dashboard) {
                const sectionHTML = `
                    <div class="class-stats-section collapsible-section">
                        <button class="collapsible-header" onclick="MobileUI.toggleCollapsible(this)">
                            <h3>📊 Class-Wise Statistics</h3>
                            <i class="fas fa-chevron-down collapsible-icon"></i>
                        </button>
                        <div class="collapsible-content">
                            <!-- Table will be inserted here -->
                        </div>
                    </div>
                `;
                dashboard.insertAdjacentHTML('beforeend', sectionHTML);
                classStatsSection = dashboard.querySelector('.class-stats-section');
            }
        }
        
        if (!classStatsSection) return;
        
        // Create table container
        const tableHTML = `
            <div class="class-stats-container">
                <div class="class-stats-scrollable">
                    <table class="class-stats-table">
                        <thead>
                            <tr>
                                <th>Class</th>
                                <th>Total</th>
                                <th>Present</th>
                                <th>Absent</th>
                                <th>Rate</th>
                                <th>Inactive</th>
                                <th>Avg Score</th>
                                <th>Mustaid</th>
                                <th>Mutawassit</th>
                                <th>Mujtahid</th>
                            </tr>
                        </thead>
                        <tbody id="class-stats-table-body">
                            ${Object.entries(classData).map(([className, data]) => `
                                <tr>
                                    <td>${className}</td>
                                    <td>${data.total || '0'}</td>
                                    <td>${data.present || '0'}</td>
                                    <td>${data.absent || '0'}</td>
                                    <td>${data.rate || '0%'}</td>
                                    <td>${data.inactive || '0'}</td>
                                    <td>${data.averageScore || '0'}</td>
                                    <td>${data.mustaidCount || '0'}</td>
                                    <td>${data.mutawassitCount || '0'}</td>
                                    <td>${data.mujtahidCount || '0'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        
        // Insert into collapsible content
        const collapsibleContent = classStatsSection.querySelector('.collapsible-content');
        if (collapsibleContent) {
            collapsibleContent.innerHTML = tableHTML;
        }
        
        console.log('📊 Class-wise stats table created with data:', Object.keys(classData).length, 'classes');
    },
    
    // ========================================================================
    // INITIALIZATION
    // ========================================================================
    
    /**
     * Initialize mobile UI features
     */
    init() {
        console.log('📱 Mobile UI: Initializing...');
        
        // Add mobile class to body
        if (this.isMobile()) {
            document.body.classList.add('mobile-view');
            console.log('📱 Mobile UI: Mobile device detected');
        }
        
        // Add touch class if touch device
        if (this.isTouchDevice()) {
            document.body.classList.add('touch-device');
            console.log('📱 Mobile UI: Touch device detected');
        }
        
        // Initialize bottom navigation
        this.initBottomNav();
        
        // Initialize compact dashboard
        this.initCompactDashboard();
        
        // Auto-update nav on hash change
        window.addEventListener('hashchange', () => {
            const hash = window.location.hash.substring(1);
            this.updateBottomNav(hash);
        });
        
        // Add haptic feedback to all buttons
        if (this.isMobile()) {
            document.addEventListener('click', (e) => {
                if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
                    this.hapticLight();
                }
            }, { passive: true });
        }
        
        console.log('✅ Mobile UI: Initialization complete');
    },
    
    /**
     * Initialize bottom navigation handlers
     */
    initBottomNav() {
        const navItems = document.querySelectorAll('.mobile-bottom-nav .nav-item');
        
        navItems.forEach(item => {
            // Only skip Teachers Corner button (has special handler)
            const itemId = item.getAttribute('id');
            if (itemId === 'mobile-teachers-nav') {
                console.log('📱 Skipping Teachers Corner button in initBottomNav (has special handler)');
                return;
            }
            
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const href = item.getAttribute('href');
                
                // Update active state
                navItems.forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                
                // Navigate to section
                if (href && href !== '#') {
                    window.location.hash = href;
                    this.hapticLight();
                    this.scrollToTop();
                }
            });
        });
        
        // Set initial active state
        const currentHash = window.location.hash || '#dashboard';
        const currentSection = currentHash.substring(1);
        this.updateBottomNav(currentSection);
    }
};

// ============================================================================
// AUTO-INITIALIZE ON MOBILE
// ============================================================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (MobileUI.isMobile()) {
            MobileUI.init();
        }
    });
} else {
    if (MobileUI.isMobile()) {
        MobileUI.init();
    }
}

// ============================================================================
// MOBILE NAVIGATION HANDLERS
// ============================================================================

const MobileNav = {
    // Store handler references to prevent duplicates
    _teachersNavHandler: null,
    
    /**
     * Create and show mobile more menu dynamically (DEPRECATED - no longer used)
     */
    showMoreMenu() {
        // Create menu if it doesn't exist
        let menu = document.getElementById('mobile-more-menu-dynamic');
        
        if (!menu) {
            const menuHTML = `
                <div id="mobile-more-menu-dynamic" class="mobile-more-menu">
                    <div class="mobile-more-overlay"></div>
                    <div class="mobile-more-content">
                        <div class="mobile-more-header">
                            <h3>More Options</h3>
                            <button class="close-btn" id="mobile-more-close">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <div class="mobile-more-list">
                            <a href="#reports" class="mobile-more-item">
                                <i class="fas fa-chart-bar"></i>
                                <span data-translate="reports">Reports</span>
                            </a>
                            <a href="#settings" class="mobile-more-item">
                                <i class="fas fa-cog"></i>
                                <span data-translate="settings">Settings</span>
                            </a>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', menuHTML);
            menu = document.getElementById('mobile-more-menu-dynamic');
            
            // Add event listeners
            menu.querySelector('.mobile-more-overlay').addEventListener('click', () => this.closeMoreMenu());
            menu.querySelector('.close-btn').addEventListener('click', () => this.closeMoreMenu());
            menu.querySelectorAll('.mobile-more-item').forEach(item => {
                item.addEventListener('click', () => this.closeMoreMenu());
            });
        }
        
        menu.style.display = 'block';
        MobileUI.hapticLight();
    },
    
    closeMoreMenu() {
        const menu = document.getElementById('mobile-more-menu-dynamic');
        if (menu) {
            menu.style.display = 'none';
        }
    },
    
    /**
     * Show teachers corner class picker using existing dropdown data
     */
    showTeachersClassPicker() {
        // Get classes from window.classes (already filtered by permissions)
        let classes = window.classes || [];
        
        // If user has limited permissions, respect them
        if (window.currentUser && window.currentUser.role === 'user' && window.currentUser.class_name) {
            classes = classes.filter(cls => cls.name === window.currentUser.class_name);
        }
        
        if (classes.length === 0) {
            alert('No classes available. Please add classes in Settings first.');
            return;
        }
        
        // Create picker if it doesn't exist
        let picker = document.getElementById('mobile-teachers-picker-dynamic');
        
        if (!picker) {
            const pickerHTML = `
                <div id="mobile-teachers-picker-dynamic" class="mobile-more-menu">
                    <div class="mobile-more-overlay"></div>
                    <div class="mobile-more-content">
                        <div class="mobile-more-header">
                            <h3>Select Class</h3>
                            <button class="close-btn" id="mobile-teachers-close">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <div class="mobile-more-list" id="mobile-teachers-list-dynamic">
                            <!-- Populated below -->
                        </div>
                    </div>
                </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', pickerHTML);
            picker = document.getElementById('mobile-teachers-picker-dynamic');
            
            // Add close handlers
            picker.querySelector('.mobile-more-overlay').addEventListener('click', () => this.closeTeachersClassPicker());
            picker.querySelector('.close-btn').addEventListener('click', () => this.closeTeachersClassPicker());
        }
        
        // Populate class list
        const classList = picker.querySelector('#mobile-teachers-list-dynamic');
        classList.innerHTML = classes.map(cls => `
            <div class="mobile-more-item" data-class="${cls.name}">
                <i class="fas fa-chalkboard"></i>
                <span>${cls.name}</span>
                <i class="fas fa-chevron-right" style="margin-left: auto;"></i>
            </div>
        `).join('');
        
        // Add click handlers for each class
        classList.querySelectorAll('.mobile-more-item').forEach(item => {
            item.addEventListener('click', () => {
                const className = item.getAttribute('data-class');
                this.selectTeachersClass(className);
            });
        });
        
        picker.style.display = 'block';
        MobileUI.hapticLight();
    },
    
    closeTeachersClassPicker() {
        const picker = document.getElementById('mobile-teachers-picker-dynamic');
        if (picker) {
            picker.style.display = 'none';
        }
    },
    
    selectTeachersClass(className) {
        this.closeTeachersClassPicker();
        
        // Use the existing function from main.js
        if (typeof openTeachersCornerForClass === 'function') {
            openTeachersCornerForClass(className);
        } else {
            console.error('openTeachersCornerForClass not found');
        }
        
        MobileUI.hapticMedium();
    },
    
    /**
     * Initialize mobile navigation event handlers
     * Safe to call multiple times - removes old listeners before adding new ones
     */
    init() {
        if (!MobileUI.isMobile()) {
            console.log('📱 Not mobile device, skipping mobile nav init');
            return;
        }
        
        console.log('📱 Initializing mobile navigation handlers...');
        
        // Ensure parent nav container is visible on mobile
        const mobileBottomNav = document.querySelector('.mobile-bottom-nav');
        if (mobileBottomNav && window.innerWidth <= 768) {
            // CSS should handle this, but ensure it's visible for handlers to work
            const computedStyle = window.getComputedStyle(mobileBottomNav);
            if (computedStyle.display === 'none') {
                console.log('📱 Mobile nav container is hidden - making visible...');
                mobileBottomNav.style.setProperty('display', 'flex', 'important');
            }
        }
        
        // Teachers Corner button (More button removed - all items now in horizontal scroll)
        const teachersNav = document.getElementById('mobile-teachers-nav');
        if (teachersNav) {
            // Remove old listener if it exists
            if (this._teachersNavHandler) {
                teachersNav.removeEventListener('click', this._teachersNavHandler);
            }
            
            // Create new handler
            this._teachersNavHandler = (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('📱 Teachers Corner button clicked');
                this.showTeachersClassPicker();
            };
            
            // Add new listener
            teachersNav.addEventListener('click', this._teachersNavHandler);
            console.log('✅ Teachers Corner button handler attached to:', teachersNav);
        } else {
            console.warn('⚠️ mobile-teachers-nav element not found - will retry after navigation update');
        }
        
        // If Teachers Corner element wasn't found, set up a retry mechanism
        if (!teachersNav) {
            console.log('📱 Teachers Corner nav element not found - will retry after navigation menu update');
        } else {
            console.log('✅ Mobile navigation handlers initialization complete');
        }
    }
};

// ============================================================================
// EXPOSE TO WINDOW
// ============================================================================

window.MobileUI = MobileUI;
window.MobileNav = MobileNav;

// Initialize mobile nav handlers when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (MobileUI.isMobile()) {
            console.log('📱 DOMContentLoaded - Initializing mobile nav handlers...');
            MobileNav.init();
        }
    });
} else {
    if (MobileUI.isMobile()) {
        console.log('📱 DOM already loaded - Initializing mobile nav handlers...');
        MobileNav.init();
    }
}

// Also initialize on window load as a fallback (after all resources loaded)
window.addEventListener('load', () => {
    if (MobileUI.isMobile()) {
        console.log('📱 Window load - Re-initializing mobile nav handlers as fallback...');
        // Small delay to ensure updateNavigationMenu has run
        setTimeout(() => {
            MobileNav.init();
        }, 300);
    }
});

console.log('📱 Mobile UI module loaded');


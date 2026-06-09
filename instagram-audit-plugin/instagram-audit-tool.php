<?php
/**
 * Plugin Name: Instagram Audit & Competitor Tool
 * Description: High-Fidelity Client Metrics & Gemini Diagnostic Auditing Dashboard for Instagram growth analytics.
 * Version: 1.0.0
 * Author: Antigravity AI
 * License: GPL-2.0+
 */

// Prevent direct file access for security
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * --------------------------------------------------------------------------
 * 1. Register Settings Page
 * --------------------------------------------------------------------------
 * Creates an options page under the main Settings menu to allow users to 
 * configure the external backend API URL.
 */
add_action( 'admin_menu', 'wp_audit_tool_add_settings_page' );

function wp_audit_tool_add_settings_page() {
    add_options_page(
        'Instagram Audit Tool Settings', // Page title
        'Instagram Audit',               // Menu title
        'manage_options',                // Capability required
        'instagram-audit-tool',          // Menu slug
        'wp_audit_tool_render_settings_page' // Callback function
    );
}

/**
 * --------------------------------------------------------------------------
 * 2. Initialize Plugin Settings
 * --------------------------------------------------------------------------
 * Registers the backend URL setting within the WordPress options table.
 */
add_action( 'admin_init', 'wp_audit_tool_settings_init' );

function wp_audit_tool_settings_init() {
    register_setting( 'wp-audit-tool-settings-group', 'wp_audit_tool_backend_url' );
}

/**
 * --------------------------------------------------------------------------
 * 3. Render Settings Page UI
 * --------------------------------------------------------------------------
 * Outputs the HTML for the plugin configuration page in the WP admin area.
 */
function wp_audit_tool_render_settings_page() {
    ?>
    <div class="wrap">
        <h1>Instagram Audit Tool Settings</h1>
        <form method="post" action="options.php">
            <?php settings_fields( 'wp-audit-tool-settings-group' ); ?>
            <?php do_settings_sections( 'wp-audit-tool-settings-group' ); ?>
            <table class="form-table">
                <tr valign="top">
                    <th scope="row">Backend API URL</th>
                    <td>
                        <input type="url" name="wp_audit_tool_backend_url" value="<?php echo esc_url( get_option('wp_audit_tool_backend_url', 'https://client-audit-tool.onrender.com') ); ?>" class="regular-text" placeholder="https://client-audit-tool.onrender.com" />
                        <p class="description">Enter the backend API endpoint URL (e.g. <code>https://client-audit-tool.onrender.com</code> or <code>https://api.yourdomain.com</code>). Do not include a trailing slash.</p>
                    </td>
                </tr>
            </table>
            <?php submit_button(); ?>
        </form>
    </div>
    <?php
}

/**
 * --------------------------------------------------------------------------
 * 4. Register Shortcode & Enqueue Assets
 * --------------------------------------------------------------------------
 * Handles the [instagram_audit_tool] shortcode execution.
 * Safely enqueues required external libraries, fonts, and local assets.
 * Uses Output Buffering to seamlessly render the template file.
 */
add_shortcode( 'instagram_audit_tool', 'wp_audit_tool_shortcode_handler' );

function wp_audit_tool_shortcode_handler() {
    // 4.1 Enqueue external typography (Google Fonts)
    wp_enqueue_style( 
        'wp-audit-tool-google-fonts', 
        'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&display=swap', 
        array(), 
        null 
    );
    
    // 4.2 Enqueue scoped local CSS styles
    wp_enqueue_style( 
        'wp-audit-tool-styles', 
        plugins_url( 'assets/css/style.css', __FILE__ ), 
        array(), 
        '1.0.0' 
    );

    // 4.3 Enqueue external JS libraries (Chart.js & Lucide Icons)
    wp_enqueue_script( 
        'wp-audit-tool-chartjs', 
        'https://cdn.jsdelivr.net/npm/chart.js', 
        array(), 
        null, 
        false 
    );
    wp_enqueue_script( 
        'wp-audit-tool-lucide-icons', 
        'https://unpkg.com/lucide@latest', 
        array(), 
        null, 
        false 
    );

    // 4.4 Enqueue local application logic scripts
    wp_enqueue_script( 
        'wp-audit-tool-app', 
        plugins_url( 'assets/js/app.js', __FILE__ ), 
        array('wp-audit-tool-chartjs', 'wp-audit-tool-lucide-icons'), 
        '1.0.0', 
        true // Load in footer
    );

    // 4.5 Fetch configured backend URL and pass it safely to JavaScript
    $backend_url = get_option( 'wp_audit_tool_backend_url', 'https://client-audit-tool.onrender.com' );
    wp_localize_script( 
        'wp-audit-tool-app', 
        'wpAuditToolSettings', 
        array(
            'backendUrl' => esc_url_raw( $backend_url )
        ) 
    );

    // 4.6 Execute output buffering to render the dashboard template
    ob_start();
    
    // Include the high-fidelity dark-mode UI template
    $template_path = plugin_dir_path( __FILE__ ) . 'templates/dashboard-template.php';
    if ( file_exists( $template_path ) ) {
        include $template_path;
    } else {
        echo '<p style="color:red;">Error: Dashboard template file is missing.</p>';
    }
    
    // Return the buffered content cleanly to the WordPress page execution
    return ob_get_clean();
}
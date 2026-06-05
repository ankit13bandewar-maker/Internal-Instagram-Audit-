<?php
/**
 * Plugin Name: Instagram Audit & Competitor Tool
 * Description: High-Fidelity Client Metrics & Gemini Diagnostic Auditing Dashboard for Instagram growth analytics.
 * Version: 1.0.0
 * Author: Antigravity AI
 * License: GPL-2.0+
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

// Register Settings Page under WordPress Settings
add_action( 'admin_menu', 'wp_audit_tool_add_settings_page' );
function wp_audit_tool_add_settings_page() {
    add_options_page(
        'Instagram Audit Tool Settings',
        'Instagram Audit',
        'manage_options',
        'instagram-audit-tool',
        'wp_audit_tool_render_settings_page'
    );
}

// Register Backend URL Options
add_action( 'admin_init', 'wp_audit_tool_settings_init' );
function wp_audit_tool_settings_init() {
    register_setting( 'wp-audit-tool-settings-group', 'wp_audit_tool_backend_url' );
}

// Render Settings Page UI
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
                    <input type="url" name="wp_audit_tool_backend_url" value="<?php echo esc_url( get_option('wp_audit_tool_backend_url', 'http://127.0.0.1:8000') ); ?>" class="regular-text" placeholder="http://127.0.0.1:8000" />
                    <p class="description">Enter your backend API endpoint URL (e.g. <code>http://127.0.0.1:8000</code> or <code>https://api.yourdomain.com</code>). Make sure it does not end with a trailing slash.</p>
                </td>
                </tr>
            </table>
            <?php submit_button(); ?>
        </form>
    </div>
    <?php
}

// Register Shortcode
add_shortcode( 'instagram_audit_tool', 'wp_audit_tool_shortcode_handler' );
function wp_audit_tool_shortcode_handler() {
    // 1. Enqueue Google Fonts
    wp_enqueue_style( 'wp-audit-tool-google-fonts', 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&display=swap', array(), null );
    
    // 2. Enqueue external JS libraries
    wp_enqueue_script( 'wp-audit-tool-chartjs', 'https://cdn.jsdelivr.net/npm/chart.js', array(), null, false );
    wp_enqueue_script( 'wp-audit-tool-lucide-icons', 'https://unpkg.com/lucide@latest', array(), null, false );

    // 3. Enqueue custom styles (Scoped to prevent theme layout breaks)
    wp_enqueue_style( 
        'wp-audit-tool-styles', 
        plugins_url( 'assets/css/style.css', __FILE__ ), 
        array(), 
        '1.0.0' 
    );

    // 4. Enqueue custom script
    wp_enqueue_script( 
        'wp-audit-tool-app', 
        plugins_url( 'assets/js/app.js', __FILE__ ), 
        array('wp-audit-tool-chartjs', 'wp-audit-tool-lucide-icons'), 
        '1.0.0', 
        true 
    );

    // 5. Inject config settings dynamically (such as Backend URL) from options table
    $backend_url = get_option( 'wp_audit_tool_backend_url', 'http://127.0.0.1:8000' );
    wp_localize_script( 'wp-audit-tool-app', 'wpAuditToolSettings', array(
        'backendUrl' => esc_url_raw( $backend_url )
    ) );

    // 6. Render shortcode HTML template content
    ob_start();
    include plugin_dir_path( __FILE__ ) . 'templates/dashboard-template.php';
    return ob_get_clean();
}

<?php
/**
 * Plugin Name: Stripe Effects
 * Description: Interactive Stripe globe using Cobe.
 * Version: 1.0.0
 * Author: Klikstudio
 */
declare(strict_types=1);

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

require_once plugin_dir_path( __FILE__ ) . 'includes/class-stripe-globe.php';
require_once plugin_dir_path( __FILE__ ) . 'includes/class-stripe-particle-ring.php';

add_action( 'plugins_loaded', function() {
    $globe = new Stripe_Globe();
    $globe->init();
    
    $particle_ring = new Stripe_Particle_Ring();
    $particle_ring->init();
});

<?php
declare(strict_types=1);

class Stripe_Particle_Ring {

    public function init(): void {
        add_action( 'init', [ $this, 'register_scripts' ] );
        add_shortcode( 'stripe_particle_ring', [ $this, 'render_shortcode' ] );
    }

    public function register_scripts(): void {
        $js_path = plugin_dir_path( dirname( __FILE__ ) ) . 'assets/js/stripe-particle-ring.js';
        $js_version = file_exists( $js_path ) ? (string) filemtime( $js_path ) : '1.0.0';

        wp_register_script_module(
            'stripe-particle-ring-script',
            plugin_dir_url( dirname( __FILE__ ) ) . 'assets/js/stripe-particle-ring.js',
            [],
            $js_version
        );
    }

    public function render_shortcode( array|string $atts, ?string $content = null ): string {
        wp_enqueue_script_module( 'stripe-particle-ring-script' );

        $defaults = [
            'width'      => '800',
            'height'     => '800',
            'align'      => 'center', // Container alignment
            'text_align' => 'center', // Content text alignment
            'ring_align' => 'center', // Ring position within canvas
        ];
        $atts = shortcode_atts( $defaults, (array) $atts, 'stripe_particle_ring' );
        
        $width      = esc_attr( $atts['width'] );
        $height     = esc_attr( $atts['height'] );
        $align      = esc_attr( $atts['align'] );
        $text_align = esc_attr( $atts['text_align'] );
        $ring_align = esc_attr( $atts['ring_align'] );

        // Unique ID for this instance
        $instance_id = 'stripe-ring-' . wp_generate_password( 8, false );

        $margin_css = '0 auto'; 
        if ( $align === 'left' ) {
            $margin_css = '0 auto 0 0';
        } elseif ( $align === 'right' ) {
            $margin_css = '0 0 0 auto';
        }

        // Mapping for content flex alignment
        $flex_align = 'center';
        if ( $text_align === 'left' ) {
            $flex_align = 'flex-start';
        } elseif ( $text_align === 'right' ) {
            $flex_align = 'flex-end';
        }

        ob_start();
        ?>
        <div class="stripe-particle-ring-wrapper" style="width: 100%; max-width: <?php echo $width; ?>px; height: <?php echo $height; ?>px; position: relative; overflow: hidden; border-radius: 12px; margin: <?php echo $margin_css; ?>; background: transparent; box-sizing: border-box;">
            <canvas class="stripe-particle-ring-canvas" id="<?php echo $instance_id; ?>" style="width: 100%; height: 100%; position: absolute; top: 0; left: 0; z-index: 1;" data-width="<?php echo $width; ?>" data-height="<?php echo $height; ?>" data-ring-align="<?php echo $ring_align; ?>"></canvas>
            <?php if ( ! empty( $content ) ) : ?>
                <div class="stripe-particle-ring-content" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 2; box-sizing: border-box; display: flex; flex-direction: column; justify-content: flex-start; align-items: <?php echo $flex_align; ?>; text-align: <?php echo $text_align; ?>;">
                    <?php 
                        $clean_content = preg_replace('/<p>\s*(<br\s*\/?>)?\s*<\/p>/i', '', $content);
                        echo do_shortcode( wp_kses_post( trim( $clean_content ) ) ); 
                    ?>
                </div>
            <?php endif; ?>
        </div>
        <?php
        return ob_get_clean();
    }
}

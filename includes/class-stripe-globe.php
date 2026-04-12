<?php
declare(strict_types=1);

class Stripe_Globe {

    public function init(): void {
        add_action( 'wp_enqueue_scripts', [ $this, 'register_scripts' ] );
        add_shortcode( 'stripe_globe', [ $this, 'render_shortcode' ] );
        
        // Add filter to allow advanced CSS properties in inline styles when passing through wp_kses
        add_filter( 'safe_style_css', [ $this, 'allow_custom_safe_css' ] );
    }

    public function register_scripts(): void {
        $js_path = plugin_dir_path( dirname( __FILE__ ) ) . 'assets/js/stripe-globe-v1.js';
        $js_version = file_exists( $js_path ) ? (string) filemtime( $js_path ) : '1.1.0';

        if ( function_exists( 'wp_register_script_module' ) ) {
            wp_register_script_module(
                'three',
                'https://unpkg.com/three@0.160.0/build/three.module.js',
                [],
                '0.160.0'
            );
            
            wp_register_script_module(
                'stripe-globe-script-v1',
                plugin_dir_url( dirname( __FILE__ ) ) . 'assets/js/stripe-globe-v1.js',
                ['three'],
                $js_version
            );
        } else {
            // Register fallback for older WP
            wp_register_script( 'three-legacy', 'https://unpkg.com/three@0.160.0/build/three.module.js', [], '0.160.0', true );
            wp_register_script( 'stripe-globe-script-fallback', plugin_dir_url( dirname( __FILE__ ) ) . 'assets/js/stripe-globe-v1.js', ['three-legacy'], $js_version, true );
            
            // Filter to add type="module" to the fallback script tags
            add_filter( 'script_loader_tag', [ $this, 'add_module_type_attribute' ], 10, 3 );
        }
    }

    public function add_module_type_attribute( $tag, $handle, $src ) {
        if ( in_array( $handle, [ 'stripe-globe-script-fallback', 'three-legacy' ], true ) ) {
            return '<script type="module" src="' . esc_url( $src ) . '" id="' . esc_attr( $handle ) . '-js"></script>';
        }
        return $tag;
    }

    public function render_shortcode( array|string $atts, ?string $content = null ): string {
        // Enqueue the script module (WP 6.5+)
        if ( function_exists( 'wp_enqueue_script_module' ) ) {
            wp_enqueue_script_module( 'stripe-globe-script-v1' );
        } else {
            // Fallback for older WordPress versions - load as traditional script
            // but we need to find a way to make it type="module"
            wp_enqueue_script( 'stripe-globe-script-fallback', plugin_dir_url( dirname( __FILE__ ) ) . 'assets/js/stripe-globe.js', ['three-legacy'], '1.0.1', true );
        }

        $defaults = [
            'width'  => '800',
            'height' => '800',
            'align'  => 'center',
        ];
        $atts = shortcode_atts( $defaults, (array) $atts, 'stripe_globe' );
        $width  = esc_attr( $atts['width'] );
        $height = esc_attr( $atts['height'] );
        $align  = esc_attr( $atts['align'] );

        $margin_css = '0 auto'; // center fallback
        if ( $align === 'left' ) {
            $margin_css = '0 auto 0 0';
        } elseif ( $align === 'right' ) {
            $margin_css = '0 0 0 auto';
        }

        $aspect_ratio = intval($width) . ' / ' . intval($height);

        ob_start();
        ?>
        <div class="stripe-globe-master-container" style="position: relative; width: 100%; max-width: 100%;">
            <!-- Contenedor del Globo Animado (Responsivo y alineable independiente) -->
            <div class="stripe-globe-wrapper" style="width: <?php echo $width; ?>px; max-width: 100%; aspect-ratio: <?php echo $aspect_ratio; ?>; position: relative; overflow: hidden; border-radius: 12px; margin: <?php echo $margin_css; ?>; background: transparent;">
                <canvas class="stripe-globe-canvas" style="width: 100%; height: 100%; position: absolute; top: 0; left: 0; z-index: 1;" data-width="<?php echo $width; ?>" data-height="<?php echo $height; ?>"></canvas>
            </div>
            
            <!-- Capa de Textos y Contenidos (Independiente y Superpuesta 100%) -->
            <?php if ( ! empty( $content ) ) : ?>
                <div class="stripe-globe-content-overlay" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 2; box-sizing: border-box; display: flex; flex-direction: column; justify-content: flex-start; pointer-events: none;">
                    <?php 
                        $clean_content = preg_replace('/<p>\s*(<br\s*\/?>)?\s*<\/p>/i', '', $content);
                    ?>
                    <div style="pointer-events: auto; width: 100%;">
                        <?php echo do_shortcode( wp_kses_post( trim( $clean_content ) ) ); ?>
                    </div>
                </div>
            <?php endif; ?>
        </div>
        <?php
        return ob_get_clean();
    }

    public function allow_custom_safe_css( $styles ) {
        $styles[] = 'text-shadow';
        $styles[] = 'box-shadow';
        return $styles;
    }
}
